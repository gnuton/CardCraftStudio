import { GoogleAuth } from 'google-auth-library';

export type ImageModel = 'imagen' | 'gemini';

export class GoogleAiService {
    private baseUrl = 'https://us-central1-aiplatform.googleapis.com/v1beta1';
    private auth: GoogleAuth;

    constructor() {
        // Initialize Google Auth with Application Default Credentials
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            // Will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
        });
    }

    private async getAuthHeaders(): Promise<Record<string, string>> {
        const client = await this.auth.getClient();
        const accessToken = await client.getAccessToken();
        if (!accessToken.token) {
            throw new Error('Failed to obtain access token');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.token}`,
        };
    }

    private getProjectId(): string {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        if (!projectId) {
            console.error('Missing GOOGLE_CLOUD_PROJECT');
            throw new Error('Server configuration error');
        }
        return projectId;
    }

    private buildLayoutPrompt(prompt: string, options?: {
        layout?: { elements: any[]; dimensions: { width: number; height: number; } },
        layoutImage?: string
    }): string {
        return prompt;
    }

    /**
     * Generate an image using Gemini 2.0 Flash (generateContent API).
     * Uses responseModalities to request image output.
     */
    private async generateWithGemini(
        prompt: string,
        finalPrompt: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        }
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        const projectId = this.getProjectId();
        const headers = await this.getAuthHeaders();

        const modelId = 'gemini-2.0-flash-exp';
        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;

        // Build the parts array: include wireframe image if available
        const parts: any[] = [];

        if (options?.layoutImage) {
            const base64Image = options.layoutImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
            console.log(`[GoogleAiService] Received layout image. Length: ${base64Image.length} chars`);

            // DEBUG: Save the image to verify what we received
            try {
                const fs = require('fs');
                const path = require('path');
                const debugPath = path.join(process.cwd(), 'debug_wireframe.png');
                fs.writeFileSync(debugPath, Buffer.from(base64Image, 'base64'));
                console.log(`[GoogleAiService] Saved debug wireframe to: ${debugPath}`);
            } catch (err) {
                console.error('[GoogleAiService] Failed to save debug wireframe:', err);
            }

            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Image,
                }
            });
        }

        parts.push({ text: finalPrompt });

        const requestBody: any = {
            systemInstruction: {
                parts: [{ text: "You are a specialized UI design assistant. Your job is to generate a background image that respects the provided wireframe layout. The wireframe shows where card elements (text, icons) will be placed. Create a background that integrates well with this layout." }]
            },
            contents: [
                {
                    role: 'user',
                    parts,
                }
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
                temperature: 1.0,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
        };

        console.log(`Using Gemini Flash model: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GoogleAiService] Gemini API Error Response:', errorText);
            let errorDetail = '';
            try {
                const errorJson = JSON.parse(errorText);
                errorDetail = Array.isArray(errorJson) ? JSON.stringify(errorJson) : (errorJson.error?.message || errorText);
            } catch (e) {
                errorDetail = errorText;
            }
            throw new Error(`Gemini API error (${response.status} ${response.statusText}): ${errorDetail}`);
        }

        const data = await response.json();

        // Parse Gemini generateContent response: look for inlineData with image mime type
        const candidates = data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates in Gemini response');
        }

        const responseParts = candidates[0].content?.parts;
        if (!responseParts || responseParts.length === 0) {
            throw new Error('No parts in Gemini response');
        }

        // Find the image part
        const imagePart = responseParts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
        if (!imagePart) {
            console.error('[GoogleAiService] No image found in Gemini response. Full response:', JSON.stringify(data, null, 2));
            // Check if there's a text part explaining the refusal
            const textPart = responseParts.find((p: any) => p.text);
            if (textPart) {
                throw new Error(`Gemini refused to generate image. Response: ${textPart.text}`);
            }
            throw new Error('No image found in Gemini response. The model may have returned only text.');
        }

        const mimeType = imagePart.inlineData.mimeType;
        const imageBytes = imagePart.inlineData.data;

        // Also extract any text part for debug info
        const textPart = responseParts.find((p: any) => p.text);

        return {
            imageBase64: `data:${mimeType};base64,${imageBytes}`,
            finalPrompt,
            debugData: {
                model: modelId,
                endpoint,
                requestBody,
                response: data,
                textResponse: textPart?.text || null
            }
        };
    }

    /**
     * Generate an image using Imagen 3.0 (predict API).
     */
    private async generateWithImagen(
        prompt: string,
        finalPrompt: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        }
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        const projectId = this.getProjectId();
        const headers = await this.getAuthHeaders();

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

        // 1. Try Image Model if layout image is available
        if (options?.layoutImage) {
            const capabilityModelEndpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict`;

            const base64Image = options.layoutImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

            const capabilityRequestBody = {
                instances: [
                    {
                        prompt: prompt,
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
                    guidanceScale: 60,
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
                            finalPrompt: finalPrompt,
                            debugData: {
                                model: 'imagen-3.0-capability-001',
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
                model: 'imagen-3.0-fast-generate-001',
                endpoint,
                requestBody,
                response: data
            }
        };
    }

    /**
     * Main entry point for image generation.
     * @param model - 'imagen' for Imagen 3.0, 'gemini' for Gemini 2.0 Flash. Defaults to 'gemini'.
     */
    async generateImage(
        prompt: string,
        style?: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        },
        model: ImageModel = 'gemini'
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        this.getProjectId(); // Validate early

        const finalPrompt = this.buildLayoutPrompt(prompt, options);

        try {
            if (model === 'gemini') {
                return await this.generateWithGemini(prompt, finalPrompt, options);
            } else {
                return await this.generateWithImagen(prompt, finalPrompt, options);
            }
        } catch (error) {
            console.error(`Error generating image with ${model}:`, error);
            throw error;
        }
    }
}

export const googleAiService = new GoogleAiService();
