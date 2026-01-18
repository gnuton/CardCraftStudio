import { db } from './db';
import { driveService } from './googleDrive';
import { calculateHash, dataURLToBlob, blobToDataURL } from '../utils/hash';

export interface ImageReference {
    id: string; // The SHA-256 hash
    fileName: string; // id + extension
}

export class ImageService {
    /**
     * Extracts images from a data URL, stores them locally in IndexedDB, 
     * and returns a reference ID.
     */
    async processImage(dataURL: string | null): Promise<string | null> {
        if (!dataURL || !dataURL.startsWith('data:')) return dataURL;

        const blob = await dataURLToBlob(dataURL);
        const hash = await calculateHash(dataURL); // Use string for consistent hash

        // Save to IndexedDB
        await db.images.put({
            id: hash,
            blob,
            mimeType: blob.type
        });

        return `ref:${hash}`;
    }

    /**
     * Resolves a reference ID back to a data URL.
     * Checks local IndexedDB first, then Google Drive if needed.
     */
    async resolveImage(ref: string | null): Promise<string | null> {
        if (!ref || !ref.startsWith('ref:')) return ref;

        const hash = ref.replace('ref:', '');
        const local = await db.images.get(hash);

        if (local) {
            return await blobToDataURL(local.blob);
        }

        // Try cloud if authenticated and if needed
        // Note: In a real app we'd probably call this during high-level sync
        return null;
    }

    /**
     * Upload missing images to Google Drive
     */
    async syncImagesToCloud(imageRefs: string[]): Promise<void> {
        for (const ref of imageRefs) {
            if (!ref.startsWith('ref:')) continue;
            const hash = ref.replace('ref:', '');

            const local = await db.images.get(hash);
            if (local) {
                const fileName = `img-${hash}.${local.mimeType.split('/')[1]}`;
                await driveService.saveBlob(fileName, local.blob);
            }
        }
    }

    /**
     * Download an image from cloud if missing locally
     */
    async downloadImageIfMissing(hash: string, cloudFileId: string): Promise<void> {
        const local = await db.images.get(hash);
        if (!local) {
            const blob = await driveService.getFileBlob(cloudFileId);
            await db.images.put({
                id: hash,
                blob,
                mimeType: blob.type
            });
        }
    }
}

export const imageService = new ImageService();
