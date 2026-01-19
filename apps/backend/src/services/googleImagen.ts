export class GoogleImagenService {
    private baseUrl = 'https://us-central1-aiplatform.googleapis.com/v1';

    async generateImage(prompt: string, style?: string): Promise<string> {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!projectId || !apiKey) {
            console.error('Missing Google Cloud credentials');
            throw new Error('Server configuration error');
        }

        // Enhance prompt with style if provided
        const enhancedPrompt = style ? `${prompt}, ${style} art style` : prompt;

        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;

        const requestBody = {
            instances: [{
                prompt: enhancedPrompt
            }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "3:4" // Card-friendly aspect ratio
            }
        };

        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Imagen API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.predictions || !data.predictions[0]?.bytesBase64Encoded) {
            throw new Error('Invalid response from Imagen API');
        }

        const imageBytes = data.predictions[0].bytesBase64Encoded;
        return `data:image/png;base64,${imageBytes}`;
    }
}

export const googleImagenService = new GoogleImagenService();
