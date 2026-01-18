/// <reference types="gapi" />
/// <reference types="gapi.client.drive" />
/// <reference types="google.accounts" />

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// NOTE: Ideally, these should be in environment variables
// But for standard GitHub Pages usage without a backend, we might prompt the user
// or use a user-provided CLIENT_ID.
let CLIENT_ID = '';

export interface GoogleDriveConfig {
    clientId: string;
}

export class GoogleDriveService {
    private tokenClient: google.accounts.oauth2.TokenClient | null = null;
    private accessToken: string | null = null;
    private isInitialized = false;

    constructor() { }

    /**
     * Loads the necessary Google scripts dynamically
     */
    async loadScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                resolve();
                return;
            }

            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://accounts.google.com/gsi/client';
                script2.onload = () => resolve();
                script2.onerror = reject;
                document.body.appendChild(script2);
            };
            script1.onerror = reject;
            document.body.appendChild(script1);
        });
    }

    /**
     * Initialize the GAPI client
     */
    async init(config: GoogleDriveConfig): Promise<void> {
        if (this.isInitialized) return;

        CLIENT_ID = config.clientId;
        await this.loadScripts();

        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    });

                    this.tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: (tokenResponse: any) => {
                            this.accessToken = tokenResponse.access_token;
                        },
                    });

                    this.isInitialized = true;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Trigger the sign-in flow
     */
    async signIn(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) return reject('Token client not initialized');

            // Override callback to capture resolution
            (this.tokenClient as any).callback = (resp: any) => {
                if (resp.error) reject(resp);
                this.accessToken = resp.access_token;
                // IMPORTANT: Pass the token to gapi.client
                gapi.client.setToken({ access_token: resp.access_token });
                resolve(resp.access_token);
            };

            // Request token
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    /**
     * Attempts to get a token without showing a popup.
     * Fails if user is not signed in or hasn't granted permissions.
     */
    async trySilentSignIn(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) return reject('Token client not initialized');

            (this.tokenClient as any).callback = (resp: any) => {
                if (resp.error) {
                    reject(resp);
                } else {
                    this.accessToken = resp.access_token;
                    gapi.client.setToken({ access_token: resp.access_token });
                    resolve(resp.access_token);
                }
            };

            // Request token silently
            this.tokenClient.requestAccessToken({ prompt: 'none' });
        });
    }

    get isSignedIn(): boolean {
        return !!this.accessToken;
    }

    /**
     * Get or create the app-specific folder
     */
    private async getAppFolderId(): Promise<string> {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='CardCraftStudio Data' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id!;
        }

        // Create folder if not exists
        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: 'CardCraftStudio Data',
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });

        return createResponse.result.id!;
    }

    /**
     * Save (upload/update) a file to the folder
     */
    async saveFile(fileName: string, content: string, mimeType = 'application/json'): Promise<void> {
        // Find if file exists
        const folderId = await this.getAppFolderId();
        const listResponse = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
        });

        const file = new Blob([content], { type: mimeType });
        const metadata = {
            name: fileName,
            mimeType: mimeType,
            parents: [folderId],
        };

        const existingFile = listResponse.result.files?.[0];

        if (existingFile) {
            // Update
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: this.createMultipartBody(metadata, file, true),
            });
            if (!response.ok) await this.handleApiError(response);
        } else {
            // Create
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: this.createMultipartBody(metadata, file),
            });
            if (!response.ok) await this.handleApiError(response);
        }
    }

    /**
     * Helper to build multipart body for Drive API
     */
    private createMultipartBody(metadata: any, file: Blob, isUpdate = false): FormData {
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(isUpdate ? {} : metadata)], { type: 'application/json' }));
        form.append('file', file);
        return form;
    }

    /**
     * List all files in the app folder
     */
    async listFiles(): Promise<any[]> {
        const folderId = await this.getAppFolderId();
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, modifiedTime, md5Checksum)',
        });
        return response.result.files || [];
    }

    /**
     * Download file content as string (for JSON)
     */
    async getFileContent(fileId: string): Promise<string> {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.body;
    }

    /**
     * Download file as Blob (for images)
     */
    /**
     * Download file as Blob (for images)
     */
    async getFileBlob(fileId: string): Promise<Blob> {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });
        if (!response.ok) await this.handleApiError(response);
        return await response.blob();
    }

    /**
     * Delete a file by ID
     */
    async deleteFile(fileId: string): Promise<void> {
        await gapi.client.drive.files.delete({
            fileId: fileId,
        });
    }

    /**
     * Save a Blob to Drive
     */
    async saveBlob(fileName: string, blob: Blob, folderId?: string): Promise<string> {
        const parentFolderId = folderId || await this.getAppFolderId();

        // Check if file exists to update or create
        const listResponse = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`,
            fields: 'files(id)',
        });

        const metadata = {
            name: fileName,
            parents: [parentFolderId],
        };

        const existingFile = listResponse.result.files?.[0];

        if (existingFile && existingFile.id) {
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: this.createMultipartBody(metadata, blob, true),
            });
            if (!response.ok) await this.handleApiError(response);
            return existingFile.id;
        } else {
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: this.createMultipartBody(metadata, blob),
            });
            if (!response.ok) await this.handleApiError(response);
            const result = await response.json();
            return result.id;
        }
    }

    /**
     * Parse API error response and throw formatted error
     */
    private async handleApiError(response: Response) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody?.error?.message) {
                errorMessage = errorBody.error.message;
            } else if (errorBody?.error_description) {
                errorMessage = errorBody.error_description;
            }
        } catch (e) {
            // Raw text fallback
            const text = await response.text();
            if (text) errorMessage = text;
        }

        // Add context for common codes
        if (response.status === 403) {
            errorMessage += " (Check API scopes and if Drive API is enabled in Google Cloud Console)";
        } else if (response.status === 401) {
            errorMessage += " (Authentication expired, please reload)";
        }

        throw new Error(errorMessage);
    }
}

export const driveService = new GoogleDriveService();
