import { db } from './firestore';

export type UserPlan = 'free' | 'premium' | 'admin';

export interface User {
    uid: string;
    email: string;
    plan: UserPlan;
    stripeCustomerId?: string;
    createdAt: Date;
    lastLogin: Date;

    // Admin-specific fields
    isAdmin: boolean;
    adminGrantedBy?: string; // UID of admin who granted this privilege
    adminGrantedAt?: Date;
    adminNotes?: string;
}

export class UserService {
    private get collection() {
        const database = db();
        if (!database) {
            throw new Error('Firestore is not initialized. Please configure GOOGLE_APPLICATION_CREDENTIALS for local development.');
        }
        return database.collection('users');
    }

    async getOrCreateUser(uid: string, email: string): Promise<User> {
        const userDoc = await this.collection.doc(uid).get();

        if (userDoc.exists) {
            const data = userDoc.data()!;
            const updatedUser: Partial<User> = {
                lastLogin: new Date(),
            };
            await this.collection.doc(uid).update(updatedUser);

            return {
                uid,
                email: data.email,
                plan: data.plan || 'free',
                stripeCustomerId: data.stripeCustomerId,
                createdAt: data.createdAt.toDate(),
                lastLogin: new Date(),
                isAdmin: data.isAdmin || false,
                adminGrantedBy: data.adminGrantedBy,
                adminGrantedAt: data.adminGrantedAt?.toDate(),
                adminNotes: data.adminNotes,
            };
        } else {
            const newUser: User = {
                uid,
                email,
                plan: 'free',
                createdAt: new Date(),
                lastLogin: new Date(),
                isAdmin: false,
            };

            await this.collection.doc(uid).set(newUser);
            return newUser;
        }
    }

    async getUserPlan(uid: string): Promise<UserPlan> {
        const userDoc = await this.collection.doc(uid).get();
        if (!userDoc.exists) return 'free';
        return userDoc.data()?.plan || 'free';
    }

    async updatePlan(uid: string, plan: UserPlan, stripeCustomerId?: string): Promise<void> {
        await this.collection.doc(uid).update({
            plan,
            ...(stripeCustomerId && { stripeCustomerId }),
        });
    }

    /**
     * Get a single user by UID
     */
    async getUser(uid: string): Promise<User | null> {
        const userDoc = await this.collection.doc(uid).get();

        if (!userDoc.exists) {
            return null;
        }

        const data = userDoc.data()!;
        return {
            uid,
            email: data.email,
            plan: data.plan || 'free',
            stripeCustomerId: data.stripeCustomerId,
            createdAt: data.createdAt.toDate(),
            lastLogin: data.lastLogin.toDate(),
            isAdmin: data.isAdmin || false,
            adminGrantedBy: data.adminGrantedBy,
            adminGrantedAt: data.adminGrantedAt?.toDate(),
            adminNotes: data.adminNotes,
        };
    }

    /**
     * Get all users with pagination and filtering
     */
    async getAllUsers(options: {
        plan?: UserPlan;
        limit?: number;
        startAfter?: string; // UID for pagination
    } = {}): Promise<User[]> {
        let query = this.collection.orderBy('createdAt', 'desc');

        if (options.plan) {
            query = query.where('plan', '==', options.plan) as any;
        }

        if (options.startAfter) {
            const startDoc = await this.collection.doc(options.startAfter).get();
            query = query.startAfter(startDoc) as any;
        }

        if (options.limit) {
            query = query.limit(options.limit) as any;
        }

        const snapshot = await query.get();

        return snapshot.docs.map(doc => ({
            uid: doc.id,
            email: doc.data().email,
            plan: doc.data().plan || 'free',
            stripeCustomerId: doc.data().stripeCustomerId,
            createdAt: doc.data().createdAt.toDate(),
            lastLogin: doc.data().lastLogin.toDate(),
            isAdmin: doc.data().isAdmin || false,
            adminGrantedBy: doc.data().adminGrantedBy,
            adminGrantedAt: doc.data().adminGrantedAt?.toDate(),
            adminNotes: doc.data().adminNotes,
        }));
    }

    /**
     * Check if a user is an admin
     */
    async isUserAdmin(uid: string): Promise<boolean> {
        const userDoc = await this.collection.doc(uid).get();
        if (!userDoc.exists) return false;
        return userDoc.data()?.isAdmin === true;
    }

    /**
     * Grant admin privileges to a user
     */
    async grantAdmin(uid: string, grantedBy: string, notes?: string): Promise<void> {
        await this.collection.doc(uid).update({
            isAdmin: true,
            plan: 'admin',
            adminGrantedBy: grantedBy,
            adminGrantedAt: new Date(),
            ...(notes && { adminNotes: notes }),
        });
    }

    /**
     * Revoke admin privileges from a user
     */
    async revokeAdmin(uid: string, previousPlan: UserPlan = 'free'): Promise<void> {
        await this.collection.doc(uid).update({
            isAdmin: false,
            plan: previousPlan,
            adminGrantedBy: null,
            adminGrantedAt: null,
        });
    }
}

export const userService = new UserService();
