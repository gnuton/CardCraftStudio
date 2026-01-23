import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveBackendService {
    private getDriveClient(accessToken: string) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        return google.drive({ version: 'v3', auth });
    }

    async listFiles(accessToken: string, folderName = 'CardCraftStudio Data') {
        const drive = this.getDriveClient(accessToken);

        // 1. Find folder
        const folderResponse = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            fields: 'files(id)',
        });

        const folderId = folderResponse.data.files?.[0]?.id;
        if (!folderId) return [];

        // 2. List files in folder
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
        });

        return response.data.files || [];
    }

    async getFileContent(accessToken: string, fileId: string) {
        const drive = this.getDriveClient(accessToken);
        const response = await drive.files.get({
            fileId,
            alt: 'media',
        });
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }

    async saveFile(accessToken: string, fileName: string, content: string, mimeType = 'application/json') {
        const drive = this.getDriveClient(accessToken);
        const folderId = await this.getOrCreateFolder(accessToken);

        // Check if exists
        const listResponse = await drive.files.list({
            q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
        });

        const existingFile = listResponse.data.files?.[0];

        // Handle Base64 decoding for binary files
        let body: any = content;
        if (mimeType.startsWith('image/') || mimeType === 'application/octet-stream') {
            body = Buffer.from(content, 'base64');
        }

        const media = {
            mimeType,
            body: Readable.from(Array.isArray(body) || Buffer.isBuffer(body) ? body : [body]),
        };

        if (existingFile?.id) {
            await drive.files.update({
                fileId: existingFile.id,
                media,
            });
            return existingFile.id;
        } else {
            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [folderId],
                    mimeType,
                },
                media,
            });
            return response.data.id;
        }
    }

    async deleteFile(accessToken: string, fileId: string) {
        const drive = this.getDriveClient(accessToken);
        await drive.files.delete({ fileId });
    }

    private async getOrCreateFolder(accessToken: string, folderName = 'CardCraftStudio Data'): Promise<string> {
        const drive = this.getDriveClient(accessToken);
        const response = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            fields: 'files(id)',
        });

        const existing = response.data.files?.[0];
        if (existing?.id) return existing.id;

        const createResponse = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });

        return createResponse.data.id!;
    }
}

export const googleDriveBackendService = new GoogleDriveBackendService();
