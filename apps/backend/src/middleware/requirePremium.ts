import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
    // Check for premium status
    // In production, this would verify a JWT token or session
    // For now, we'll use a simple header check
    const isPremium = req.headers['x-premium-user'] === 'true';

    if (!isPremium) {
        return next(new ApiError(403, 'Premium subscription required', 'This endpoint requires a premium subscription.', 'https://cardcraft.io/premium'));
    }

    next();
};
