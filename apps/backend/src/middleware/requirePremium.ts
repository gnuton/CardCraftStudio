import { Request, Response, NextFunction } from 'express';

export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
    // Check for premium status
    // In production, this would verify a JWT token or session
    // For now, we'll use a simple header check
    const isPremium = req.headers['x-premium-user'] === 'true';

    if (!isPremium) {
        return res.status(403).json({ error: 'Premium subscription required' });
    }

    next();
};
