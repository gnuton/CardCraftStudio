import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Authentication required', 'Please sign in to access premium features.'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);

        // Allow admins to access premium features
        if (decoded.plan !== 'premium' && decoded.plan !== 'admin') {
            return next(new ApiError(403, 'Premium subscription required', 'This endpoint requires a premium subscription.', 'https://cardcraft.io/premium'));
        }

        // Attach user info to request for downstream use if needed
        (req as any).user = decoded;
        next();
    } catch (err) {
        return next(new ApiError(401, 'Invalid session', 'Your session has expired or is invalid. Please sign in again.'));
    }
};
