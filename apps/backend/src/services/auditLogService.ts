import { db } from './firestore';
import { FieldValue } from 'firebase-admin/firestore';

export type AdminAction =
    | 'bootstrap_admin'
    | 'grant_admin'
    | 'revoke_admin'
    | 'override_subscription'
    | 'impersonate_user'
    | 'impersonate_exit'
    | 'view_audit_logs'
    | 'view_analytics'
    | 'unauthorized_admin_access';

export interface AdminAuditLog {
    id: string;
    adminId: string; // UID of admin performing the action
    action: AdminAction;
    targetUserId?: string; // UID of user being acted upon (if applicable)
    details?: Record<string, any>; // Flexible storage for action-specific data
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    endedAt?: Date; // For tracking impersonation session duration
}

export interface CreateAuditLogParams {
    adminId: string;
    action: AdminAction;
    targetUserId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export interface UpdateAuditLogParams {
    endedAt?: Date;
    details?: Record<string, any>;
}

export class AuditLogService {
    private collection = db.collection('admin_audit_logs');

    /**
     * Create a new audit log entry
     */
    async createLog(params: CreateAuditLogParams): Promise<string> {
        const docRef = await this.collection.add({
            adminId: params.adminId,
            action: params.action,
            targetUserId: params.targetUserId || null,
            details: params.details || {},
            ipAddress: params.ipAddress || null,
            userAgent: params.userAgent || null,
            createdAt: FieldValue.serverTimestamp(),
            endedAt: null,
        });

        return docRef.id;
    }

    /**
     * Update an existing audit log (e.g., to add endedAt for impersonation)
     */
    async updateLog(logId: string, updates: UpdateAuditLogParams): Promise<void> {
        const updateData: any = {};

        if (updates.endedAt) {
            updateData.endedAt = updates.endedAt;
        }

        if (updates.details) {
            updateData.details = updates.details;
        }

        await this.collection.doc(logId).update(updateData);
    }

    /**
     * Get audit logs with pagination and filtering
     */
    async getLogs(options: {
        adminId?: string;
        action?: AdminAction;
        targetUserId?: string;
        limit?: number;
        startAfter?: string; // Document ID for pagination
    }): Promise<AdminAuditLog[]> {
        let query = this.collection.orderBy('createdAt', 'desc');

        // Apply filters
        if (options.adminId) {
            query = query.where('adminId', '==', options.adminId) as any;
        }

        if (options.action) {
            query = query.where('action', '==', options.action) as any;
        }

        if (options.targetUserId) {
            query = query.where('targetUserId', '==', options.targetUserId) as any;
        }

        // Apply pagination
        if (options.startAfter) {
            const startDoc = await this.collection.doc(options.startAfter).get();
            query = query.startAfter(startDoc) as any;
        }

        if (options.limit) {
            query = query.limit(options.limit) as any;
        }

        const snapshot = await query.get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            endedAt: doc.data().endedAt?.toDate(),
        } as AdminAuditLog));
    }

    /**
     * Get active impersonation sessions
     */
    async getActiveImpersonationSessions(): Promise<AdminAuditLog[]> {
        const snapshot = await this.collection
            .where('action', '==', 'impersonate_user')
            .where('endedAt', '==', null)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        } as AdminAuditLog));
    }

    /**
     * Get impersonation session by ID
     */
    async getImpersonationSession(sessionId: string): Promise<AdminAuditLog | null> {
        const doc = await this.collection.doc(sessionId).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()!.createdAt?.toDate(),
            endedAt: doc.data()!.endedAt?.toDate(),
        } as AdminAuditLog;
    }
}

export const auditLogService = new AuditLogService();
