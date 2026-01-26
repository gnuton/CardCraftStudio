import { google } from 'googleapis';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'default-encryption-key-32-chars-!!'; // Should be 32 chars
const IV_LENGTH = 16;

export interface TokenPack {
    accessToken: string;
    refreshToken: string;
    expiryDate?: number;
    idToken?: string;
}

export class GoogleAuthService {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth-callback.html'
        );
    }

    async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<TokenPack> {
        const { tokens } = await this.oauth2Client.getToken({
            code,
            redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth-callback.html'
        });
        return {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiryDate: tokens.expiry_date || undefined,
            idToken: tokens.id_token || undefined
        };
    }

    async refreshAccessToken(refreshToken: string): Promise<TokenPack> {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return {
            accessToken: credentials.access_token!,
            refreshToken: credentials.refresh_token || refreshToken,
            expiryDate: credentials.expiry_date || undefined
        };
    }

    /**
     * Encrypts a string (e.g. refresh token) to be safely stored on the client
     */
    encryptToken(token: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
        let encrypted = cipher.update(token);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    /**
     * Decrypts a string encrypted by encryptToken
     */
    decryptToken(encryptedToken: string): string {
        const textParts = encryptedToken.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}

export const googleAuthService = new GoogleAuthService();
