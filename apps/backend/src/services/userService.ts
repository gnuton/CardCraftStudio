import { db } from './firestore';

export type UserPlan = 'free' | 'premium';

export interface User {
    uid: string;
    email: string;
    plan: UserPlan;
    stripeCustomerId?: string;
    createdAt: Date;
    lastLogin: Date;
}

export class UserService {
    private collection = db.collection('users');

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
            };
        } else {
            const newUser: User = {
                uid,
                email,
                plan: 'free',
                createdAt: new Date(),
                lastLogin: new Date(),
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
}

export const userService = new UserService();
