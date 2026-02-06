import { Router } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin';
import { userService } from '../services/userService';
import { auditLogService } from '../services/auditLogService';
import { ApiError } from '../utils/ApiError';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/admin/impersonate/exit
 * Exit impersonation and return to admin session
 */
router.post('/exit', async (req: AuthenticatedRequest, res, next) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError(401, 'Authentication required', 'Please provide an impersonation token.'));
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);

            // Verify this is an impersonation session
            if (!decoded.isImpersonating) {
                return next(new ApiError(400, 'Not impersonating', 'You are not currently in an impersonation session.'));
            }

            // Update audit log with session end time and duration
            const duration = Math.floor((Date.now() - decoded.startedAt) / 1000); // Duration in seconds
            await auditLogService.updateLog(decoded.sessionId, {
                endedAt: new Date(),
                details: {
                    duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
                    durationSeconds: duration,
                },
            });

            // Get admin user info
            const adminUser = await userService.getUser(decoded.adminId);
            if (!adminUser) {
                return next(new ApiError(404, 'Admin user not found'));
            }

            // Create fresh admin JWT
            const adminToken = jwt.sign(
                {
                    uid: adminUser.uid,
                    email: adminUser.email,
                    plan: adminUser.plan,
                    isAdmin: adminUser.isAdmin,
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                token: adminToken,
                user: {
                    uid: adminUser.uid,
                    email: adminUser.email,
                    plan: adminUser.plan,
                    isAdmin: adminUser.isAdmin,
                },
                session: {
                    sessionId: decoded.sessionId,
                    duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
                },
            });
        } catch (err) {
            return next(new ApiError(401, 'Invalid impersonation token', 'Your impersonation session has expired or is invalid.'));
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/impersonate/:userId
 * Start impersonating a user
 */
router.post('/:userId', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const targetUserId = req.params.userId as string;
        const adminId = req.adminContext!.adminId;
        const adminEmail = req.user!.email;

        // Get target user
        const targetUser = await userService.getUser(targetUserId as string);

        if (!targetUser) {
            return next(new ApiError(404, 'User not found', `No user found with ID: ${targetUserId}`));
        }

        // Security: Prevent impersonating other admins
        if (targetUser.isAdmin) {
            // Log the attempt
            await auditLogService.createLog({
                adminId,
                action: 'impersonate_user',
                targetUserId: targetUserId as string,
                details: {
                    event: 'impersonation_blocked_admin_target',
                    targetEmail: targetUser.email,
                    reason: 'Cannot impersonate other admins',
                },
                ipAddress: req.adminContext!.ip,
                userAgent: req.adminContext!.userAgent,
            });

            return next(
                new ApiError(
                    403,
                    'Cannot impersonate admin users',
                    'Impersonation of other administrators is not allowed for security reasons.'
                )
            );
        }

        // Create audit log entry for this impersonation session
        const sessionId = await auditLogService.createLog({
            adminId,
            action: 'impersonate_user',
            targetUserId,
            details: {
                targetEmail: targetUser.email,
                targetPlan: targetUser.plan,
                adminEmail,
            },
            ipAddress: req.adminContext!.ip,
            userAgent: req.adminContext!.userAgent,
        });

        // Create impersonation JWT
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        const impersonationToken = jwt.sign(
            {
                // Target user identity
                uid: targetUser.uid,
                email: targetUser.email,
                plan: targetUser.plan,
                isAdmin: false, // Impersonator experiences target user's tier

                // Impersonation metadata
                isImpersonating: true,
                adminId,
                adminEmail,
                sessionId,
                startedAt: Date.now(),
            },
            JWT_SECRET,
            { expiresIn: '1h' } // Impersonation sessions expire after 1 hour
        );

        res.json({
            success: true,
            impersonationToken,
            session: {
                sessionId,
                targetUser: {
                    uid: targetUser.uid,
                    email: targetUser.email,
                    plan: targetUser.plan,
                },
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            },
        });
    } catch (error) {
        next(error);
    }
});

// Moved above

/**
 * GET /api/admin/impersonate/sessions
 * Get active impersonation sessions
 */
router.get('/sessions', requireAdmin, async (req: AuthenticatedRequest, res, next) => {
    try {
        const activeSessions = await auditLogService.getActiveImpersonationSessions();

        const sessions = activeSessions.map(session => ({
            sessionId: session.id,
            adminId: session.adminId,
            targetUserId: session.targetUserId,
            targetEmail: session.details?.targetEmail,
            targetPlan: session.details?.targetPlan,
            startedAt: session.createdAt,
            duration: Math.floor((Date.now() - session.createdAt.getTime()) / 1000), // seconds
        }));

        res.json({
            sessions,
            count: sessions.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/impersonate/validate
 * Validate current impersonation session
 */
router.get('/validate', async (req: AuthenticatedRequest, res, next) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ valid: false, reason: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);

            if (!decoded.isImpersonating) {
                return res.json({ valid: false, reason: 'Not an impersonation session' });
            }

            // Check session hasn't been manually ended
            const session = await auditLogService.getImpersonationSession(decoded.sessionId);

            if (!session) {
                return res.json({ valid: false, reason: 'Session not found' });
            }

            if (session.endedAt) {
                return res.json({ valid: false, reason: 'Session has been ended' });
            }

            // Check session duration (should expire at 1h)
            const duration = Date.now() - decoded.startedAt;
            const oneHour = 60 * 60 * 1000;

            if (duration > oneHour) {
                return res.json({ valid: false, reason: 'Invalid token (Session expired)' });
            }

            res.json({
                valid: true,
                session: {
                    sessionId: decoded.sessionId,
                    targetUser: {
                        uid: decoded.uid,
                        email: decoded.email,
                        plan: decoded.plan,
                    },
                    admin: {
                        uid: decoded.adminId,
                        email: decoded.adminEmail,
                    },
                    startedAt: new Date(decoded.startedAt),
                    expiresAt: new Date(decoded.startedAt + oneHour),
                    remainingTime: Math.floor((oneHour - duration) / 1000), // seconds
                },
            });
        } catch (err) {
            return res.json({ valid: false, reason: 'Invalid token' });
        }
    } catch (error) {
        next(error);
    }
});

export default router;
