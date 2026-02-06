import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { generateAdminToken, JWT_SECRET } from './testUtils';
import { userService } from '../src/services/userService';
import { auditLogService } from '../src/services/auditLogService';

// Mock the services
vi.mock('../src/services/userService');
vi.mock('../src/services/auditLogService');

describe('Impersonation Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        app = createApp();
        vi.clearAllMocks();
    });

    describe('POST /api/admin/impersonate/:userId', () => {
        it('should start impersonation and return impersonation token', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'free',
                isAdmin: false,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);
            vi.mocked(auditLogService.createLog).mockResolvedValue('session-id-123');

            const response = await request(app)
                .post('/api/admin/impersonate/target-user')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.impersonationToken).toBeDefined();
            expect(response.body.session.sessionId).toBe('session-id-123');
            expect(response.body.session.targetUser.email).toBe('target@test.com');

            // Verify the impersonation token contains correct claims
            const decoded: any = jwt.verify(response.body.impersonationToken, JWT_SECRET);
            expect(decoded.uid).toBe('target-user');
            expect(decoded.email).toBe('target@test.com');
            expect(decoded.isImpersonating).toBe(true);
            expect(decoded.adminId).toBe('test-admin-uid');
            expect(decoded.isAdmin).toBe(false); // Should NOT have admin privileges
        });

        it('should prevent impersonating another admin', async () => {
            const targetAdmin = {
                uid: 'other-admin',
                email: 'admin2@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetAdmin as any);
            vi.mocked(auditLogService.createLog).mockResolvedValue('log-id');

            const response = await request(app)
                .post('/api/admin/impersonate/other-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(403);
            expect(response.body.detail).toContain('Impersonation of other administrators is not allowed');

            // Verify the blocked attempt was logged
            expect(auditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'impersonate_user',
                    details: expect.objectContaining({
                        event: 'impersonation_blocked_admin_target',
                    })
                })
            );
        });

        it('should return 404 if target user does not exist', async () => {
            vi.mocked(userService.getUser).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/impersonate/nonexistent')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(404);
            expect(response.body.detail).toContain('No user found');
        });

        it('should return 401 if called without admin token', async () => {
            const response = await request(app)
                .post('/api/admin/impersonate/target-user');

            expect(response.status).toBe(401);
        });

        it('should log impersonation start event', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'free',
                isAdmin: false,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);
            vi.mocked(auditLogService.createLog).mockResolvedValue('session-id');

            await request(app)
                .post('/api/admin/impersonate/target-user')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(auditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    adminId: 'test-admin-uid',
                    action: 'impersonate_user',
                    targetUserId: 'target-user',
                    details: expect.objectContaining({
                        targetEmail: 'target@test.com',
                        targetPlan: 'free',
                    })
                })
            );
        });
    });

    describe('POST /api/admin/impersonate/exit', () => {
        it('should exit impersonation and return admin token', async () => {
            // Create a valid impersonation token
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'test-admin-uid',
                    adminEmail: 'admin@test.com',
                    sessionId: 'session-123',
                    startedAt: Date.now() - 60000, // 1 minute ago
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const adminUser = {
                uid: 'test-admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(adminUser as any);
            vi.mocked(auditLogService.updateLog).mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/admin/impersonate/exit')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.isAdmin).toBe(true);
            expect(response.body.user.email).toBe('admin@test.com');

            // Verify session was closed in audit log
            expect(auditLogService.updateLog).toHaveBeenCalledWith(
                'session-123',
                expect.objectContaining({
                    endedAt: expect.any(Date),
                    details: expect.objectContaining({
                        durationSeconds: expect.any(Number),
                    })
                })
            );
        });

        it('should return 400 if not currently impersonating', async () => {
            // Regular admin token (not impersonating)
            const adminToken = generateAdminToken();

            const response = await request(app)
                .post('/api/admin/impersonate/exit')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.detail).toContain('You are not currently in an impersonation session');
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(app)
                .post('/api/admin/impersonate/exit')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        it('should calculate session duration correctly', async () => {
            const startTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'test-admin-uid',
                    adminEmail: 'admin@test.com',
                    sessionId: 'session-123',
                    startedAt: startTime,
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const adminUser = {
                uid: 'test-admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(adminUser as any);
            vi.mocked(auditLogService.updateLog).mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/admin/impersonate/exit')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(200);
            expect(response.body.session.duration).toMatch(/^[45]m/); // Should be ~5 minutes
        });
    });

    describe('GET /api/admin/impersonate/sessions', () => {
        it('should return list of active impersonation sessions', async () => {
            const mockSessions = [
                {
                    id: 'session1',
                    adminId: 'admin1',
                    targetUserId: 'user1',
                    details: {
                        targetEmail: 'user1@test.com',
                        targetPlan: 'free',
                    },
                    createdAt: new Date(Date.now() - 600000), // 10 minutes ago
                    endedAt: null,
                },
                {
                    id: 'session2',
                    adminId: 'admin2',
                    targetUserId: 'user2',
                    details: {
                        targetEmail: 'user2@test.com',
                        targetPlan: 'premium',
                    },
                    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
                    endedAt: null,
                },
            ];

            vi.mocked(auditLogService.getActiveImpersonationSessions).mockResolvedValue(mockSessions as any);

            const response = await request(app)
                .get('/api/admin/impersonate/sessions')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.sessions).toHaveLength(2);
            expect(response.body.count).toBe(2);
            expect(response.body.sessions[0].sessionId).toBe('session1');
            expect(response.body.sessions[0].duration).toBeGreaterThan(0);
        });

        it('should require admin token', async () => {
            const response = await request(app)
                .get('/api/admin/impersonate/sessions');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/admin/impersonate/validate', () => {
        it('should validate active impersonation session', async () => {
            const startTime = Date.now() - 600000; // 10 minutes ago
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'admin-uid',
                    adminEmail: 'admin@test.com',
                    sessionId: 'session-123',
                    startedAt: startTime,
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const mockSession = {
                id: 'session-123',
                endedAt: null,
            };

            vi.mocked(auditLogService.getImpersonationSession).mockResolvedValue(mockSession as any);

            const response = await request(app)
                .get('/api/admin/impersonate/validate')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
            expect(response.body.session.targetUser.email).toBe('target@test.com');
            expect(response.body.session.admin.email).toBe('admin@test.com');
            expect(response.body.session.remainingTime).toBeGreaterThan(0);
        });

        it('should return invalid for expired session', async () => {
            const startTime = Date.now() - 4000000; // Over 1 hour ago
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'admin-uid',
                    adminEmail: 'admin@test.com',
                    sessionId: 'session-123',
                    startedAt: startTime,
                },
                JWT_SECRET,
                { expiresIn: '10s' } // Very short expiry for testing
            );

            const mockSession = {
                id: 'session-123',
                endedAt: null,
            };

            vi.mocked(auditLogService.getImpersonationSession).mockResolvedValue(mockSession as any);

            await new Promise(resolve => setTimeout(resolve, 20)); // Wait for token to expire

            const response = await request(app)
                .get('/api/admin/impersonate/validate')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(false);
            expect(response.body.reason).toContain('Invalid token');
        });

        it('should return invalid for ended session', async () => {
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'admin-uid',
                    adminEmail: 'admin@test.com',
                    sessionId: 'session-123',
                    startedAt: Date.now() - 600000,
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const mockSession = {
                id: 'session-123',
                endedAt: new Date(), // Session was ended
            };

            vi.mocked(auditLogService.getImpersonationSession).mockResolvedValue(mockSession as any);

            const response = await request(app)
                .get('/api/admin/impersonate/validate')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(false);
            expect(response.body.reason).toBe('Session has been ended');
        });

        it('should return invalid for non-impersonation token', async () => {
            const regularToken = generateAdminToken();

            const response = await request(app)
                .get('/api/admin/impersonate/validate')
                .set('Authorization', `Bearer ${regularToken}`);

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(false);
            expect(response.body.reason).toBe('Not an impersonation session');
        });
    });

    describe('Impersonation Security', () => {
        it('should block admin routes when impersonating', async () => {
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'admin-uid',
                    sessionId: 'session-123',
                    startedAt: Date.now(),
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Try to access admin routes with impersonation token
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(response.status).toBe(403);
            expect(response.body.detail).toContain('Exit impersonation mode');
        });

        it('should log unauthorized admin access attempts during impersonation', async () => {
            const impersonationToken = jwt.sign(
                {
                    uid: 'target-user',
                    email: 'target@test.com',
                    plan: 'free',
                    isImpersonating: true,
                    adminId: 'admin-uid',
                    sessionId: 'session-123',
                    startedAt: Date.now(),
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            vi.mocked(auditLogService.createLog).mockResolvedValue('log-id');

            await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${impersonationToken}`);

            expect(auditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'unauthorized_admin_access',
                })
            );
        });
    });
});
