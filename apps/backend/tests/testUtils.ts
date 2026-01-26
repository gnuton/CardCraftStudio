import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'test-jwt-secret';

export const generateTestToken = (plan: 'free' | 'premium' = 'premium') => {
    return jwt.sign(
        {
            uid: 'test-uid',
            email: 'test@example.com',
            plan
        },
        JWT_SECRET
    );
};
