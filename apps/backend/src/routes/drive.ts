import { Router } from 'express';
import { googleAuthService } from '../services/googleAuth';
import { googleDriveBackendService } from '../services/googleDrive';

export const driveRouter = Router();

// 1. Exchange Auth Code for Tokens
driveRouter.post('/auth/token', async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const tokens = await googleAuthService.exchangeCodeForTokens(code);

        // Encrypt refresh token for client-side storage
        const encryptedRefreshToken = googleAuthService.encryptToken(tokens.refreshToken);

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: encryptedRefreshToken,
            expiryDate: tokens.expiryDate
        });
    } catch (error) {
        next(error);
    }
});

// 2. Refresh Token
driveRouter.post('/auth/refresh', async (req, res, next) => {
    try {
        const { refreshToken: encryptedToken } = req.body;
        if (!encryptedToken) return res.status(400).json({ error: 'Refresh token is required' });

        const decryptedToken = googleAuthService.decryptToken(encryptedToken);
        const tokens = await googleAuthService.refreshAccessToken(decryptedToken);

        // Re-encrypt (it might have rotated, though usually it doesn't in this flow)
        const newEncryptedToken = googleAuthService.encryptToken(tokens.refreshToken);

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: newEncryptedToken,
            expiryDate: tokens.expiryDate
        });
    } catch (error) {
        next(error);
    }
});

// 3. List Files
driveRouter.get('/files', async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

        const files = await googleDriveBackendService.listFiles(accessToken);
        res.json(files);
    } catch (error) {
        next(error);
    }
});

// 4. Save File
driveRouter.post('/files', async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

        const { name, content, mimeType } = req.body;
        const fileId = await googleDriveBackendService.saveFile(accessToken, name, content, mimeType);
        res.json({ id: fileId });
    } catch (error) {
        next(error);
    }
});

// 5. Get File Content
driveRouter.get('/files/:id', async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

        const content = await googleDriveBackendService.getFileContent(accessToken, req.params.id);
        res.send(content);
    } catch (error) {
        next(error);
    }
});

// 6. Delete File
driveRouter.delete('/files/:id', async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) return res.status(401).json({ error: 'Unauthorized' });

        await googleDriveBackendService.deleteFile(accessToken, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});
