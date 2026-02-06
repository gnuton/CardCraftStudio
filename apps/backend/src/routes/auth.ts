import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import { googleAuthService } from '../services/googleAuth';

router.post('/login', async (req, res, next) => {
    try {
        const { idToken, code, redirectUri } = req.body;

        if (!idToken && !code) {
            return res.status(400).json({ error: 'idToken or authorization code is required' });
        }

        let googleId: string;
        let email: string;
        let driveCredentials: any = null;

        if (code) {
            // Flow A: Authorization Code (New Unified Flow)
            const tokens = await googleAuthService.exchangeCodeForTokens(code, redirectUri);

            if (!tokens.idToken) {
                return res.status(401).json({ error: 'No ID Token returned from Google' });
            }

            // Verify the ID token (we can re-verify or trust the direct response if we trust TLS, 
            // but verifying using the library is safer and extracts payload)
            const ticket = await client.verifyIdToken({
                idToken: tokens.idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            if (!payload || !payload.sub || !payload.email) {
                return res.status(401).json({ error: 'Invalid token payload' });
            }

            googleId = payload.sub;
            email = payload.email;

            // Prepare Drive Credentials
            if (tokens.refreshToken) {
                const encryptedRefresh = googleAuthService.encryptToken(tokens.refreshToken);
                driveCredentials = {
                    accessToken: tokens.accessToken,
                    refreshToken: encryptedRefresh,
                    expiryDate: tokens.expiryDate
                };
            }
        } else {
            // Flow B: Direct ID Token (Legacy/Simple Auth)
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.sub || !payload.email) {
                return res.status(401).json({ error: 'Invalid token payload' });
            }

            googleId = payload.sub;
            email = payload.email;
        }

        // 2. Get or Create User in Firestore
        const user = await userService.getOrCreateUser(googleId, email);

        // 3. Admin Bootstrap: Check if this user should be granted admin automatically
        const ADMIN_BOOTSTRAP_EMAIL = process.env.ADMIN_BOOTSTRAP_EMAIL;
        if (ADMIN_BOOTSTRAP_EMAIL && email === ADMIN_BOOTSTRAP_EMAIL && !user.isAdmin) {
            // Grant admin privileges
            await userService.grantAdmin(user.uid, 'SYSTEM_BOOTSTRAP', 'Initial bootstrap admin');

            // Update user object
            user.isAdmin = true;
            user.plan = 'admin';

            // Log bootstrap action
            const { auditLogService } = await import('../services/auditLogService');
            await auditLogService.createLog({
                adminId: user.uid,
                action: 'bootstrap_admin',
                details: {
                    method: 'environment_variable',
                    bootstrapEmail: ADMIN_BOOTSTRAP_EMAIL,
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });

            console.log(`✅ Admin bootstrapped: ${email}`);
        }

        // 4. Issue JWT
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        const sessionToken = jwt.sign(
            {
                uid: user.uid,
                email: user.email,
                plan: user.plan,
                isAdmin: user.isAdmin,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token: sessionToken,
            user: {
                uid: user.uid,
                email: user.email,
                plan: user.plan,
            },
            driveCredentials // Optional: undefined if not available
        });
    } catch (error) {
        const err = error as any;
        console.error('Auth Error Full:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
        res.status(401).json({ error: 'Authentication failed', details: err.message });
    }
});

router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await userService.getOrCreateUser(decoded.uid, decoded.email);
        res.json({
            uid: user.uid,
            email: user.email,
            plan: user.plan,
            isAdmin: user.isAdmin,
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
