import { Router } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin';
import { userService } from '../services/userService';
import { auditLogService } from '../services/auditLogService';
import { ApiError } from '../utils/ApiError';

const router = Router();

// Helper to safely extract string from query param
const getQueryString = (param: any): string | undefined => {
    if (!param) return undefined;
    if (Array.isArray(param)) return param[0] as string;
    if (typeof param === 'object') return undefined;
    return param as string;
};

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
 */
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const limitStr = getQueryString(req.query.limit) || '50';
        const plan = getQueryString(req.query.plan);
        const startAfter = getQueryString(req.query.startAfter);
        const search = getQueryString(req.query.search);

        // Get users with filtering
        const users = await userService.getAllUsers({
            plan: plan as any,
            limit: parseInt(limitStr),
            startAfter,
        });

        // If search query is provided, filter by email
        let filteredUsers = users;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = users.filter(user =>
                user.email.toLowerCase().includes(searchLower) ||
                user.uid.includes(searchLower)
            );
        }

        // Get user count by tier for stats
        const allUsers = await userService.getAllUsers({ limit: 10000 }); // TODO: optimize this
        const stats = {
            total: allUsers.length,
            byTier: {
                free: allUsers.filter(u => u.plan === 'free').length,
                premium: allUsers.filter(u => u.plan === 'premium').length,
                admin: allUsers.filter(u => u.plan === 'admin').length,
            },
        };

        res.json({
            users: filteredUsers,
            stats,
            pagination: {
                limit: parseInt(limitStr),
                hasMore: users.length === parseInt(limitStr),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users/audit-logs
 * Get audit logs with filtering
 */
router.get('/users/audit-logs', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const adminId = getQueryString(req.query.adminId);
        const action = getQueryString(req.query.action);
        const targetUserId = getQueryString(req.query.targetUserId);
        const limitStr = getQueryString(req.query.limit) || '100';
        const startAfter = getQueryString(req.query.startAfter);

        const logs = await auditLogService.getLogs({
            adminId,
            action: action as any,
            targetUserId,
            limit: parseInt(limitStr),
            startAfter,
        });

        res.json({
            logs,
            pagination: {
                limit: parseInt(limitStr),
                hasMore: logs.length === parseInt(limitStr),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users/analytics
 * Get platform-wide analytics
 */
router.get('/users/analytics', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        // Get all users for analytics
        const allUsers = await userService.getAllUsers({ limit: 10000 }); // TODO: optimize with aggregation

        // Calculate metrics
        const totalUsers = allUsers.length;
        const usersByTier = {
            free: allUsers.filter(u => u.plan === 'free').length,
            premium: allUsers.filter(u => u.plan === 'premium').length,
            admin: allUsers.filter(u => u.plan === 'admin').length,
        };

        // Recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = allUsers.filter(u => u.createdAt >= thirtyDaysAgo).length;

        // Active users (logged in within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsers = allUsers.filter(u => u.lastLogin >= sevenDaysAgo).length;

        // Get audit log stats
        const recentLogs = await auditLogService.getLogs({ limit: 1000 });
        const adminActions = recentLogs.length;
        const impersonationSessions = recentLogs.filter(l => l.action === 'impersonate_user').length;

        res.json({
            users: {
                total: totalUsers,
                byTier: usersByTier,
                recentSignups,
                activeUsers,
            },
            admin: {
                totalActions: adminActions,
                impersonationSessions,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users/:userId
 * Get a single user's details
 */
router.get('/users/:userId', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.params.userId;

        const user = await userService.getUser(userId as string);

        if (!user) {
            return next(new ApiError(404, 'User not found', 'User not found'));
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/users/:userId/grant-admin
 * Grant admin privileges to a user
 */
router.post('/users/:userId/grant-admin', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.params.userId;
        const { notes } = req.body;
        const adminId = req.adminContext!.adminId;

        // Get target user
        const targetUser = await userService.getUser(userId);

        if (!targetUser) {
            return next(new ApiError(404, 'User not found', `No user found with ID: ${userId}`));
        }

        // Check if user is already an admin
        if (targetUser.isAdmin) {
            return next(new ApiError(400, 'User is already an admin', 'User is already an admin'));
        }

        // Grant admin privileges
        await userService.grantAdmin(userId, adminId, notes);

        // Log the action
        await auditLogService.createLog({
            adminId,
            action: 'grant_admin',
            targetUserId: userId,
            details: {
                targetEmail: targetUser.email,
                notes: notes || 'No notes provided',
            },
            ipAddress: req.adminContext!.ip,
            userAgent: req.adminContext!.userAgent,
        });

        res.json({
            success: true,
            message: `Admin privileges granted to ${targetUser.email}`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/users/:userId/revoke-admin
 * Revoke admin privileges from a user
 */
router.post('/users/:userId/revoke-admin', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.params.userId;
        const { notes, previousPlan = 'free' } = req.body;
        const adminId = req.adminContext!.adminId;

        // Prevent self-revocation
        if (userId === adminId) {
            return next(new ApiError(403, 'Cannot revoke your own admin privileges', 'Cannot revoke your own admin privileges'));
        }

        // Get target user
        const targetUser = await userService.getUser(userId);

        if (!targetUser) {
            return next(new ApiError(404, 'User not found', `No user found with ID: ${userId}`));
        }

        // Check if user is actually an admin
        if (!targetUser.isAdmin) {
            return next(new ApiError(400, 'User is not an admin', 'User is not an admin'));
        }

        // Revoke admin privileges
        await userService.revokeAdmin(userId, previousPlan);

        // Log the action
        await auditLogService.createLog({
            adminId,
            action: 'revoke_admin',
            targetUserId: userId,
            details: {
                targetEmail: targetUser.email,
                previousPlan,
                notes: notes || 'No notes provided',
            },
            ipAddress: req.adminContext!.ip,
            userAgent: req.adminContext!.userAgent,
        });

        res.json({
            success: true,
            message: `Admin privileges revoked from ${targetUser.email}`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/users/:userId/override-subscription
 * Manually override a user's subscription tier
 */
router.post('/users/:userId/override-subscription', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.params.userId;
        const { tier, reason } = req.body;
        const adminId = req.adminContext!.adminId;

        // Validate input
        if (!tier || !['free', 'premium'].includes(tier)) {
            return next(new ApiError(400, 'Invalid tier', 'Invalid tier: must be either "free" or "premium".'));
        }

        if (!reason) {
            return next(new ApiError(400, 'Reason required', 'Reason required: You must provide a reason for the subscription override.'));
        }

        // Get target user
        const targetUser = await userService.getUser(userId);

        if (!targetUser) {
            return next(new ApiError(404, 'User not found', `No user found with ID: ${userId}`));
        }

        // Don't allow overriding admin users
        if (targetUser.isAdmin) {
            return next(new ApiError(403, 'Cannot override admin subscription', 'Cannot override admin subscription'));
        }

        // Update the plan
        await userService.updatePlan(userId, tier);

        // Log the action
        await auditLogService.createLog({
            adminId,
            action: 'override_subscription',
            targetUserId: userId,
            details: {
                targetEmail: targetUser.email,
                previousTier: targetUser.plan,
                newTier: tier,
                reason,
            },
            ipAddress: req.adminContext!.ip,
            userAgent: req.adminContext!.userAgent,
        });

        res.json({
            success: true,
            message: `Subscription updated to ${tier} for ${targetUser.email}`,
        });
    } catch (error) {
        next(error);
    }
});

// Result is already handled by moving routes above

export default router;
