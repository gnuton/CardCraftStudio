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

    async generateImage(
        prompt: string,
        style?: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } }
        }
    ): Promise<{ imageBase64: string; finalPrompt: string }> {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;

        if (!projectId) {
            console.error('Missing GOOGLE_CLOUD_PROJECT');
            throw new Error('Server configuration error');
        }

        let finalPrompt = prompt;

        // Handle Layout Constraints via Prompt Engineering
        if (options?.layout && options.layout.elements.length > 0) {
            const { width, height } = options.layout.dimensions;
            const elements = options.layout.elements;

            // Layout description using structured coordinates (0-1000 scale)
            const descriptions = elements.map((el: any) => {
                const screenX = width / 2 + el.x - el.width / 2;
                const screenY = height / 2 + el.y - el.height / 2;

                const leftVal = Math.round((screenX / width) * 1000);
                const topVal = Math.round((screenY / height) * 1000);
                const widthVal = Math.round((el.width / width) * 1000);
                const heightVal = Math.round((el.height / height) * 1000);

                return `[${el.name || el.type}]: x:${leftVal}, y:${topVal}, w:${widthVal}, h:${heightVal}`;
            });

            finalPrompt += `\n\nLayout coordinates (1000x1000 scale):\n${descriptions.join('\n')}`;
        }

        // Enhance prompt with style if provided
        if (style) {
            finalPrompt = `${finalPrompt}, ${style} art style`;
        }

        // Use Imagen 3 fast model for lower latency
        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`;

        const requestBody = {
            instances: [{
                prompt: finalPrompt
            }],
            parameters: {
                sampleCount: 1,
                // Use provided aspect ratio or default to 3:4
                aspectRatio: options?.aspectRatio || "3:4"
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
            return {
                imageBase64: `data:image/png;base64,${imageBytes}`,
                finalPrompt
            };
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }
}

export const googleImagenService = new GoogleImagenService();
