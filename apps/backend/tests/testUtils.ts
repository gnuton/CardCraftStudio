import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'test-jwt-secret';

export const generateTestToken = (plan: 'free' | 'premium' | 'admin' = 'premium', isAdmin = false) => {
    return jwt.sign(
        {
            uid: 'test-uid',
            email: 'test@example.com',
            plan,
            isAdmin
        },
        JWT_SECRET
    );
};

export const generateAdminToken = () => {
    return jwt.sign(
        {
            uid: 'test-admin-uid',
            email: 'admin@test.com',
            plan: 'admin',
            isAdmin: true
        },
        JWT_SECRET
    );
};
