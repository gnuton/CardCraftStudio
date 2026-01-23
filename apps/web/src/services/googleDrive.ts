/// <reference types="google.accounts" />

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Configuration from environment
let CLIENT_ID = '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface GoogleDriveConfig {
    clientId: string;
}

interface AuthResponse {
    accessToken: string;
    refreshToken: string; // This is the encrypted one from the backend
    expiryDate?: number;
}

export class GoogleDriveService {
    private accessToken: string | null = null;
    private isInitialized = false;

    constructor() { }

    /**
     * Loads the Google Identiy Services script dynamically
     */
    async loadScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof google !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => resolve();
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    async init(config: GoogleDriveConfig): Promise<void> {
        if (this.isInitialized) return;
        CLIENT_ID = config.clientId;
        await this.loadScripts();

        // Try to recover session from local storage
        const storedToken = localStorage.getItem('gdrive_access_token');
        const expiresAt = localStorage.getItem('gdrive_token_expires_at');

        if (storedToken && expiresAt && Date.now() < Number(expiresAt) - 60000) {
            this.accessToken = storedToken;
        }

        this.isInitialized = true;
    }

    get isReady(): boolean {
        return this.isInitialized;
    }

    get isSignedIn(): boolean {
        return !!this.accessToken && Date.now() < Number(localStorage.getItem('gdrive_token_expires_at')) - 60000;
    }

    /**
     * Trigger the sign-in flow (Auth Code Flow)
     */
    async signIn(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!CLIENT_ID) return reject('Client ID not configured');

            const redirectUri = `${window.location.origin}${window.location.pathname}oauth-callback.html`.replace(/\/\/oauth/, '/oauth');
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `response_type=code&` +
                `scope=${encodeURIComponent(SCOPES)}&` +
                `access_type=offline&` +
                `prompt=consent`;

            // Open the popup
            const width = 500;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(authUrl, 'google_auth_popup', `width=${width},height=${height},left=${left},top=${top}`);

            if (!popup) {
                return reject('Popup blocked. Please allow popups for this site.');
            }

            const channel = new BroadcastChannel('google_drive_auth');

            const cleanup = () => {
                channel.close();
                if (checkInterval) clearInterval(checkInterval);
            };

            const checkInterval = setInterval(() => {
                if (popup.closed) {
                    cleanup();
                    reject('Authentication window was closed');
                }
            }, 1000);

            channel.onmessage = async (event) => {
                const { code, error } = event.data;
                cleanup();

                if (error) {
                    reject(error);
                } else if (code) {
                    try {
                        // Exchange code for tokens via backend
                        const response = await fetch(`${API_BASE_URL}/api/drive/auth/token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code })
                        });

                        if (!response.ok) throw new Error('Failed to exchange auth code');

                        const data: AuthResponse = await response.json();
                        this.saveSession(data);
                        resolve(data.accessToken);
                    } catch (e) {
                        reject(e);
                    }
                }
            };
        });
    }

    private saveSession(data: AuthResponse) {
        this.accessToken = data.accessToken;
        localStorage.setItem('gdrive_access_token', data.accessToken);
        localStorage.setItem('gdrive_refresh_token', data.refreshToken);

        const expiry = data.expiryDate || (Date.now() + 3599 * 1000);
        localStorage.setItem('gdrive_token_expires_at', expiry.toString());
    }

    async ensureSignedIn(): Promise<string> {
        const expiresAt = localStorage.getItem('gdrive_token_expires_at');
        const now = Date.now();

        if (this.accessToken && expiresAt && now < Number(expiresAt) - 60000) {
            return this.accessToken;
        }

        const refreshToken = localStorage.getItem('gdrive_refresh_token');
        if (refreshToken) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/drive/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (response.ok) {
                    const data: AuthResponse = await response.json();
                    this.saveSession(data);
                    return data.accessToken;
                }
            } catch (e) {
                console.error('Failed to refresh token', e);
            }
        }

        return await this.signIn();
    }

    /**
     * Proxy calls to Backend for Drive operations
     */
    async listFiles(): Promise<any[]> {
        const token = await this.ensureSignedIn();
        const response = await fetch(`${API_BASE_URL}/api/drive/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to list files');
        return await response.json();
    }

    async getFileContent(fileId: string): Promise<string> {
        const token = await this.ensureSignedIn();
        const response = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to get file content');
        return await response.text();
    }

    async saveFile(fileName: string, content: string, mimeType = 'application/json'): Promise<void> {
        const token = await this.ensureSignedIn();
        const response = await fetch(`${API_BASE_URL}/api/drive/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: fileName, content, mimeType })
        });
        if (!response.ok) throw new Error('Failed to save file');
    }

    async deleteFile(fileId: string): Promise<void> {
        const token = await this.ensureSignedIn();
        const response = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete file');
    }

    async getFileBlob(fileId: string): Promise<Blob> {
        const token = await this.ensureSignedIn();
        const response = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to get file blob');
        return await response.blob();
    }

    async saveBlob(fileName: string, blob: Blob): Promise<string> {
        const token = await this.ensureSignedIn();

        // Convert blob to base64 for simplicity in the proxy (or use FormData)
        // Let's use Base64 to keep the backend route simple for now
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
        });

        const base64 = await base64Promise;

        const response = await fetch(`${API_BASE_URL}/api/drive/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: fileName, content: base64, mimeType: blob.type })
        });

        if (!response.ok) throw new Error('Failed to save blob');
        const data = await response.json();
        return data.id;
    }
}

export const driveService = new GoogleDriveService();
