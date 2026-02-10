import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let db: Firestore | null = null;
let initializationAttempted = false;

function getDb(): Firestore | null {
    // Only attempt initialization once
    if (!initializationAttempted) {
        initializationAttempted = true;

        // Only initialize in production or if explicitly configured
        const isProduction = process.env.NODE_ENV === 'production';
        const isGcp = !!process.env.GOOGLE_CLOUD_PROJECT;
        const hasExplicitCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG;

        if (!isProduction && !isGcp && !hasExplicitCredentials) {
            console.warn('[Firestore] Running in local development mode without Firebase credentials.');
            console.warn('[Firestore] Firestore features will be disabled.');
            console.warn('[Firestore] Set GOOGLE_APPLICATION_CREDENTIALS to enable Firestore in local development.');
            return null;
        }

        try {
            if (!getApps().length) {
                app = initializeApp();
            } else {
                app = getApps()[0];
            }
            db = getFirestore(app);
            console.log('[Firestore] Successfully initialized');
        } catch (error) {
            console.error('[Firestore] Failed to initialize:', error);
            console.warn('[Firestore] Firestore features will be disabled.');
        }
    }

    return db;
}

export { getDb as db };
