
import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driveRouter } from '../src/routes/drive';
import { googleAuthService } from '../src/services/googleAuth';
import { googleDriveBackendService } from '../src/services/googleDrive';

// Mock services
vi.mock('../src/services/googleAuth', () => ({
    googleAuthService: {
        exchangeCodeForTokens: vi.fn(),
        encryptToken: vi.fn(),
        decryptToken: vi.fn(),
        refreshAccessToken: vi.fn()
    }
}));

vi.mock('../src/services/googleDrive', () => ({
    googleDriveBackendService: {
        listFiles: vi.fn(),
        saveFile: vi.fn(),
        getFileContent: vi.fn(),
        deleteFile: vi.fn()
    }
}));

const app = express();
app.use(express.json());
app.use('/api/drive', driveRouter);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
});

describe('Drive Router', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /auth/token', () => {
        it('should exchange code for tokens', async () => {
            vi.mocked(googleAuthService.exchangeCodeForTokens).mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiryDate: 1234567890
            });
            vi.mocked(googleAuthService.encryptToken).mockReturnValue('encrypted-refresh-token');

            const res = await request(app)
                .post('/api/drive/auth/token')
                .send({ code: 'auth-code' });

            expect(googleAuthService.exchangeCodeForTokens).toHaveBeenCalledWith('auth-code', undefined);
        });

        it('should exchange code for tokens with specific redirectUri', async () => {
            vi.mocked(googleAuthService.exchangeCodeForTokens).mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiryDate: 1234567890
            });

            const res = await request(app)
                .post('/api/drive/auth/token')
                .send({ code: 'auth-code', redirectUri: 'custom-uri' });

            expect(res.status).toBe(200);
            expect(googleAuthService.exchangeCodeForTokens).toHaveBeenCalledWith('auth-code', 'custom-uri');
        });

        it('should return 400 if code is missing', async () => {
            const res = await request(app)
                .post('/api/drive/auth/token')
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('GET /files', () => {
        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/drive/files');
            expect(res.status).toBe(401);
        });

        it('should list files', async () => {
            const mockFiles = [{ id: '1', name: 'test' }];
            vi.mocked(googleDriveBackendService.listFiles).mockResolvedValue(mockFiles as any);

            const res = await request(app)
                .get('/api/drive/files')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockFiles);
            expect(googleDriveBackendService.listFiles).toHaveBeenCalledWith('valid-token');
        });
    });

    describe('Save Flow', () => {
        it('should save file', async () => {
            vi.mocked(googleDriveBackendService.saveFile).mockResolvedValue('new-file-id');

            const res = await request(app)
                .post('/api/drive/files')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: 'test.json', content: '{}', mimeType: 'application/json' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ id: 'new-file-id' });
            expect(googleDriveBackendService.saveFile).toHaveBeenCalledWith('valid-token', 'test.json', '{}', 'application/json');
        });
    });
});
