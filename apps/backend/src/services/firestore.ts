import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
if (!getApps().length) {
    app = initializeApp();
} else {
    app = getApps()[0];
}

export const db: Firestore = getFirestore(app);
