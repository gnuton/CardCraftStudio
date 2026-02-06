import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { createApp } from '../src/app';
import { generateTestToken, generateAdminToken, JWT_SECRET } from './testUtils';
import { userService } from '../src/services/userService';
import { auditLogService } from '../src/services/auditLogService';

// Mock the services
vi.mock('../src/services/userService');
vi.mock('../src/services/auditLogService');

describe('Admin Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
        app = createApp();
        vi.clearAllMocks();
    });

    describe('GET /api/admin/users', () => {
        it('should return 401 when called without token', async () => {
            const response = await request(app)
                .get('/api/admin/users');

            expect(response.status).toBe(401);
        });

        it('should return 403 when called with non-admin token', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${generateTestToken('premium')}`);

            expect(response.status).toBe(403);
            expect(response.body.detail).toContain('admin');
        });

        it('should return user list when called with admin token', async () => {
            const mockUsers = [
                { uid: 'user1', email: 'user1@test.com', plan: 'free', isAdmin: false },
                { uid: 'user2', email: 'user2@test.com', plan: 'premium', isAdmin: false },
            ];

            vi.mocked(userService.getAllUsers).mockResolvedValue(mockUsers as any);

            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(2);
            expect(response.body.stats).toBeDefined();
        });

        it('should filter users by plan when plan query param is provided', async () => {
            const mockUsers = [
                { uid: 'user1', email: 'user1@test.com', plan: 'premium', isAdmin: false },
            ];

            vi.mocked(userService.getAllUsers).mockResolvedValue(mockUsers as any);

            const response = await request(app)
                .get('/api/admin/users?plan=premium')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(userService.getAllUsers).toHaveBeenCalledWith(
                expect.objectContaining({ plan: 'premium' })
            );
        });

        it('should search users by email when search query param is provided', async () => {
            const mockUsers = [
                { uid: 'user1', email: 'john@test.com', plan: 'free', isAdmin: false },
                { uid: 'user2', email: 'jane@test.com', plan: 'free', isAdmin: false },
            ];

            vi.mocked(userService.getAllUsers).mockResolvedValue(mockUsers as any);

            const response = await request(app)
                .get('/api/admin/users?search=john')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(1);
            expect(response.body.users[0].email).toBe('john@test.com');
        });
    });

    describe('POST /api/admin/users/:userId/grant-admin', () => {
        it('should grant admin privileges to a user', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'free',
                isAdmin: false,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);
            vi.mocked(userService.grantAdmin).mockResolvedValue(undefined);
            vi.mocked(auditLogService.createLog).mockResolvedValue('log-id');

            const response = await request(app)
                .post('/api/admin/users/target-user/grant-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({ notes: 'Promoted to admin' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(userService.grantAdmin).toHaveBeenCalledWith(
                'target-user',
                'test-admin-uid',
                'Promoted to admin'
            );
            expect(auditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'grant_admin',
                    targetUserId: 'target-user',
                })
            );
        });

        it('should return 400 if user is already an admin', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);

            const response = await request(app)
                .post('/api/admin/users/target-user/grant-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(400);
            expect(response.body.detail).toContain('already an admin');
        });

        it('should return 404 if user does not exist', async () => {
            vi.mocked(userService.getUser).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/users/nonexistent/grant-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/admin/users/:userId/revoke-admin', () => {
        it('should revoke admin privileges from a user', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);
            vi.mocked(userService.revokeAdmin).mockResolvedValue(undefined);
            vi.mocked(auditLogService.createLog).mockResolvedValue('log-id');

            const response = await request(app)
                .post('/api/admin/users/target-user/revoke-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({ previousPlan: 'free', notes: 'No longer on team' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(userService.revokeAdmin).toHaveBeenCalledWith('target-user', 'free');
        });

        it('should prevent self-revocation', async () => {
            const adminUser = {
                uid: 'test-admin-uid',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(adminUser as any);

            const response = await request(app)
                .post('/api/admin/users/test-admin-uid/revoke-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(403);
            expect(response.body.detail).toContain('Cannot revoke your own');
        });

        it('should return 400 if user is not an admin', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'free',
                isAdmin: false,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);

            const response = await request(app)
                .post('/api/admin/users/target-user/revoke-admin')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(400);
            expect(response.body.detail).toContain('User is not an admin');
        });
    });

    describe('POST /api/admin/users/:userId/override-subscription', () => {
        it('should override user subscription to premium', async () => {
            const targetUser = {
                uid: 'target-user',
                email: 'target@test.com',
                plan: 'free',
                isAdmin: false,
            };

            vi.mocked(userService.getUser).mockResolvedValue(targetUser as any);
            vi.mocked(userService.updatePlan).mockResolvedValue(undefined);
            vi.mocked(auditLogService.createLog).mockResolvedValue('log-id');

            const response = await request(app)
                .post('/api/admin/users/target-user/override-subscription')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({
                    tier: 'premium',
                    reason: 'Customer service gesture'
                });

            expect(response.status).toBe(200);
            expect(userService.updatePlan).toHaveBeenCalledWith('target-user', 'premium');
            expect(auditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'override_subscription',
                    details: expect.objectContaining({
                        newTier: 'premium',
                        previousTier: 'free',
                        reason: 'Customer service gesture'
                    })
                })
            );
        });

        it('should return 400 for invalid tier', async () => {
            const response = await request(app)
                .post('/api/admin/users/target-user/override-subscription')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({
                    tier: 'invalid',
                    reason: 'Test'
                });

            expect(response.status).toBe(400);
            expect(response.body.detail).toContain('Invalid tier');
        });

        it('should return 400 if reason is not provided', async () => {
            const response = await request(app)
                .post('/api/admin/users/target-user/override-subscription')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({ tier: 'premium' });

            expect(response.status).toBe(400);
            expect(response.body.detail).toContain('Reason required');
        });

        it('should prevent overriding admin user subscriptions', async () => {
            const adminUser = {
                uid: 'target-user',
                email: 'admin@test.com',
                plan: 'admin',
                isAdmin: true,
            };

            vi.mocked(userService.getUser).mockResolvedValue(adminUser as any);

            const response = await request(app)
                .post('/api/admin/users/target-user/override-subscription')
                .set('Authorization', `Bearer ${generateAdminToken()}`)
                .send({
                    tier: 'free',
                    reason: 'Test'
                });

            expect(response.status).toBe(403);
            expect(response.body.detail).toContain('Cannot override admin subscription');
        });
    });

    describe('GET /api/admin/users/audit-logs', () => {
        it('should return audit logs', async () => {
            const mockLogs = [
                {
                    id: 'log1',
                    adminId: 'admin1',
                    action: 'grant_admin',
                    targetUserId: 'user1',
                    createdAt: new Date(),
                },
            ];

            vi.mocked(auditLogService.getLogs).mockResolvedValue(mockLogs as any);

            const response = await request(app)
                .get('/api/admin/users/audit-logs')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.logs).toHaveLength(1);
        });

        it('should filter audit logs by adminId', async () => {
            vi.mocked(auditLogService.getLogs).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/admin/users/audit-logs?adminId=admin1')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(auditLogService.getLogs).toHaveBeenCalledWith(
                expect.objectContaining({ adminId: 'admin1' })
            );
        });
    });

    describe('GET /api/admin/users/analytics', () => {
        it('should return platform analytics', async () => {
            const mockUsers = [
                { uid: 'user1', email: 'user1@test.com', plan: 'free', isAdmin: false, createdAt: new Date(), lastLogin: new Date() },
                { uid: 'user2', email: 'user2@test.com', plan: 'premium', isAdmin: false, createdAt: new Date(), lastLogin: new Date() },
            ];

            vi.mocked(userService.getAllUsers).mockResolvedValue(mockUsers as any);
            vi.mocked(auditLogService.getLogs).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/admin/users/analytics')
                .set('Authorization', `Bearer ${generateAdminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.users.total).toBe(2);
            expect(response.body.users.byTier).toBeDefined();
            expect(response.body.admin).toBeDefined();
        });
    });
});
