
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function debugAsset(assetId: string) {
    console.log(`Debug Asset: ${assetId}`);
    const doc = await db.collection('assets').doc(assetId).get();

    if (!doc.exists) {
        console.log('Asset not found in "assets" collection');
        return;
    }

    const asset = doc.data();
    console.log('Asset Data:', JSON.stringify(asset, null, 2));

    if (asset?.driveFileId) {
        console.log(`Checking assetData for storageId: ${asset.driveFileId}`);
        const dataDoc = await db.collection('assetData').doc(asset.driveFileId).get();
        if (dataDoc.exists) {
            console.log('AssetData found:', JSON.stringify(dataDoc.data(), null, 2));
        } else {
            console.log('❌ AssetData NOT FOUND in "assetData" collection');
        }
    } else {
        console.log('❌ No driveFileId on asset');
    }
}

debugAsset('lxfoekrjcGuWPWxBxv1m');
