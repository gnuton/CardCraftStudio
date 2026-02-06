import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore | null = null;

try {
    if (!getApps().length) {
        // Check if we have credentials for Firebase
        const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            process.env.FIREBASE_CONFIG ||
            // In production (Cloud Run, etc.), default credentials are available
            process.env.NODE_ENV === 'production';

        if (hasCredentials || process.env.NODE_ENV === 'production') {
            app = initializeApp();
            db = getFirestore(app);
            console.log('[Firestore] Successfully initialized');
        } else {
            console.warn('[Firestore] No credentials found. Firestore features will be disabled.');
            console.warn('[Firestore] Set GOOGLE_APPLICATION_CREDENTIALS to enable Firestore in local development.');
        }
    } else {
        app = getApps()[0];
        db = getFirestore(app);
    }
} catch (error) {
    console.error('[Firestore] Failed to initialize:', error);
    console.warn('[Firestore] Firestore features will be disabled.');
}

export { db };
