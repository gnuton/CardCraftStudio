import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { auditLogService } from '../services/auditLogService';

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        plan: string;
        isAdmin?: boolean;
        isImpersonating?: boolean;
    };
    impersonationContext?: {
        adminId: string;
        adminEmail: string;
        sessionId: string;
        startedAt: number;
    };
    adminContext?: {
        adminId: string;
        ip: string;
        userAgent?: string;
    };
}

/**
 * Middleware to require admin access
 * Blocks impersonating users from accessing admin routes
 */
export const requireAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new ApiError(
                401,
                'Authentication required',
                'Please sign in to access admin features.'
            )
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);

        // Check if user is impersonating - block access during impersonation
        if (decoded.isImpersonating === true) {
            // Log unauthorized access attempt
            await auditLogService.createLog({
                adminId: decoded.adminId,
                action: 'unauthorized_admin_access',
                details: {
                    event: 'impersonation_admin_access_blocked',
                    endpoint: req.path,
                    method: req.method,
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            return next(
                new ApiError(
                    403,
                    'Admin access not available during impersonation',
                    'Exit impersonation mode to access admin features.'
                )
            );
        }

        // Check if user is an admin
        if (!decoded.isAdmin || decoded.plan !== 'admin') {
            // Log unauthorized access attempt
            await auditLogService.createLog({
                adminId: decoded.uid,
                action: 'unauthorized_admin_access',
                details: {
                    event: 'unauthorized_admin_access',
                    endpoint: req.path,
                    method: req.method,
                    userPlan: decoded.plan,
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            return next(
                new ApiError(
                    403,
                    'Admin access required',
                    'This endpoint requires administrator privileges.'
                )
            );
        }

        // Attach user info and admin context to request
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            plan: decoded.plan,
            isAdmin: true,
        };

        req.adminContext = {
            adminId: decoded.uid,
            ip: req.ip || 'unknown',
            userAgent: req.headers['user-agent'],
        };

        next();
    } catch (err) {
        return next(
            new ApiError(
                401,
                'Invalid session',
                'Your session has expired or is invalid. Please sign in again.'
            )
        );
    }
};
