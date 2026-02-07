import { GoogleAuth } from 'google-auth-library';

export class GoogleImagenService {
    private baseUrl = 'https://us-central1-aiplatform.googleapis.com/v1';
    private auth: GoogleAuth;

    constructor() {
        // Initialize Google Auth with Application Default Credentials
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            // Will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
        });
    }

    async generateImage(prompt: string, style?: string): Promise<string> {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;

        if (!projectId) {
            console.error('Missing GOOGLE_CLOUD_PROJECT');
            throw new Error('Server configuration error');
        }

        // Enhance prompt with style if provided
        const enhancedPrompt = style ? `${prompt}, ${style} art style` : prompt;

        // Use Imagen 3 fast model for lower latency
        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`;

        const requestBody = {
            instances: [{
                prompt: enhancedPrompt
            }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "3:4" // Card-friendly aspect ratio
            }
        };

        try {
            // Get an authenticated client
            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();

            if (!accessToken.token) {
                throw new Error('Failed to obtain access token');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken.token}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Imagen API Error Response:', errorText);
                throw new Error(`Imagen API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.predictions || !data.predictions[0]?.bytesBase64Encoded) {
                throw new Error('Invalid response from Imagen API');
            }

            const imageBytes = data.predictions[0].bytesBase64Encoded;
            return `data:image/png;base64,${imageBytes}`;
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }
}

export const googleImagenService = new GoogleImagenService();
