import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        plan: string;
        isAdmin?: boolean;
        isImpersonating?: boolean;
    };
}

/**
 * Middleware to require basic authentication
 * Used for routes that need any authenticated user (free or premium)
 */
export const requireAuth = (
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
                'Please sign in to access this feature.'
            )
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            plan: decoded.plan,
            isAdmin: decoded.isAdmin,
            isImpersonating: decoded.isImpersonating,
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
