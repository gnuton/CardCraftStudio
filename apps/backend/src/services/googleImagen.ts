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
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        }
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;

        if (!projectId) {
            console.error('Missing GOOGLE_CLOUD_PROJECT');
            throw new Error('Server configuration error');
        }

        let finalPrompt = prompt;

        // Handle Layout Constraints via Prompt Engineering
        // Fallback: Since image-guided models (image-generation@006/005/002) are returning 404/500,
        // we will use the working imagen-3.0-fast-generate-001 and enhance the prompt with coordinates.
        // Handle Layout Constraints via Prompt Engineering
        // ONLY if no layout image is provided (to avoid conflicting instructions)
        if (options?.layout && options.layout.elements.length > 0 && !options.layoutImage) {
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

                return ` - ${el.name || el.type}: Position(x=${leftVal}, y=${topVal}), Size(w=${widthVal}, h=${heightVal})`;
            });

            finalPrompt += `\n\n### Layout Requirements
The user is designing a card with specific element placements. You MUST generate a background that respects these areas.
The following list defines the "Restricted Zones" where card elements (text, icons) will be placed.
Inside these zones, the background should be uniform, dark, or low-detail to ensure text readability.
Do NOT place main subjects or busy details inside these zones. 
Frame the composition AROUND these zones.

Restricted Zones (0-1000 scale from top-left):
${descriptions.join('\n')}`;
        }

        let endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-fast-generate-001:predict`;
        let requestBody: any = {
            instances: [{
                prompt: finalPrompt
            }],
            parameters: {
                sampleCount: 1,
                aspectRatio: options?.aspectRatio || "3:4",
                negativePrompt: "text, writing, letters, words, typography, watermark, logo, signature, busy details where text should be, cluttered background in text areas",
                safetySetting: "block_only_high"
            }
        };

        // If layout image is provided, try to use the image-capable model first

        try {
            // Get an authenticated client
            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();

            if (!accessToken.token) {
                throw new Error('Failed to obtain access token');
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.token}`,
            };

            // 1. Try Image Model if available
            if (options?.layoutImage) {
                // Use imagen-3.0-capability-001 for wireframe-guided generation
                const capabilityModelEndpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict`;

                const base64Image = options.layoutImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

                const capabilityRequestBody = {
                    instances: [
                        {
                            prompt: prompt, // Use the PURE prompt here, without coordinates, for structural guidance
                            referenceImages: [
                                {
                                    referenceId: 1,
                                    referenceType: "REFERENCE_TYPE_CONTROL",
                                    referenceImage: {
                                        bytesBase64Encoded: base64Image,
                                        mimeType: "image/png"
                                    },
                                    controlImageConfig: {
                                        controlType: "CONTROL_TYPE_CANNY",
                                        enableControlImageComputation: true
                                    }
                                }
                            ]
                        }
                    ],
                    parameters: {
                        editMode: "EDIT_MODE_DEFAULT",
                        sampleCount: 1,
                        personGeneration: "allow_all",
                        safetySettings: "block_few",
                        guidanceScale: 60, // Significantly increased to force structural adherence
                        includeRaiReason: true,
                        aspectRatio: options?.aspectRatio || "3:4",
                        outputOptions: {
                            mimeType: "image/jpeg",
                            compressionQuality: 95
                        }
                    }
                };

                try {
                    console.log(`Attempting to use capability model: ${capabilityModelEndpoint}`);
                    const response = await fetch(capabilityModelEndpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(capabilityRequestBody)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
                            return {
                                imageBase64: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
                                finalPrompt: finalPrompt, // Use original prompt as final since we don't modify it for this model
                                debugData: {
                                    endpoint: capabilityModelEndpoint,
                                    requestBody: capabilityRequestBody,
                                    response: data
                                }
                            };
                        }
                    } else {
                        const errorText = await response.text();
                        console.warn(`Capability model failed with status ${response.status}: ${errorText}. Falling back to text-only model.`);
                    }
                } catch (e) {
                    console.warn('Capability model generation failed, falling back to text-only:', e);
                }
            }

            // 2. Fallback or Default to Fast Text Model
            console.log(`Using text-only model: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
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
                finalPrompt,
                debugData: {
                    endpoint,
                    requestBody,
                    response: data
                }
            };
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }
}

export const googleImagenService = new GoogleImagenService();
