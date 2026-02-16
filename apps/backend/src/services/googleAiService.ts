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
     * Generate an image using Gemini (generateContent API).
     * Uses responseModalities to request image output.
     */
    private async generateWithGemini(
        prompt: string,
        finalPrompt: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        },
        modelId: string = 'gemini-2.0-flash-exp'
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        const projectId = this.getProjectId();
        const headers = await this.getAuthHeaders();

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

        console.log(`Using Gemini model: ${endpoint}`);
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
     * Generate an image using Imagen (predict API).
     */
    private async generateWithImagen(
        prompt: string,
        finalPrompt: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        },
        modelId: string = 'imagen-3.0-fast-generate-001'
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        const projectId = this.getProjectId();
        const headers = await this.getAuthHeaders();

        // Use passed modelId or default if 'imagen' is passed generically
        const actualModelId = modelId === 'imagen' ? 'imagen-3.0-fast-generate-001' : modelId;
        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/${actualModelId}:predict`;

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

        // 1. Try Capability Model if specifically requested or if standard model is used with layout
        // Note: For now, we only use capability model logic if specifically hardcoded or requested?
        // Let's keep the existing logic: if layoutImage is present, force specific capability endpoint usage unless overridden?
        // Actually, if the user selects a specific Imagen model, we should probably respect it.
        // BUT, if they provide a layoutImage, only specific models might support it.
        // For simplicity, if layoutImage is present, we try the capability model first ONLY IF the user hasn't forced a specific other model?
        // Or better: Let's assume the user knows what they are doing if they select a model.

        // Retaining original logic for 'capability' automatic switch only if using standard generation?
        // To be safe, let's keep the distinct block for layoutImage but make sure it uses the correct endpoint structure.

        if (options?.layoutImage) {
            // Capability model specific endpoint
            const capabilityModelId = 'imagen-3.0-capability-001';
            const capabilityModelEndpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/${capabilityModelId}:predict`;

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

            // Only switch to capability model if the selected model ISN'T explicitly something else preventing it?
            // For now, let's allow the 'layout' option to override with capability model if strictly needed,
            // or just log that we are using it.
            // If the user selected 'imagen-3.0-generate-001', they might not get layout support.
            // Let's check if the selected actualModelId supports it?
            // For safety: If layoutImage is present, we prefer capability model endpoint, unless user selected a specific non-capability one?
            // Let's keep the original behavior: if layoutImage is present, TRY capability model.

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
                                model: capabilityModelId,
                                endpoint: capabilityModelEndpoint,
                                requestBody: capabilityRequestBody,
                                response: data
                            }
                        };
                    }
                } else {
                    const errorText = await response.text();
                    console.warn(`Capability model failed with status ${response.status}: ${errorText}. Falling back to selected text-only model ${actualModelId}.`);
                }
            } catch (e) {
                console.warn('Capability model generation failed, falling back to text-only:', e);
            }
        }

        // 2. Use the selected model (or default fast)
        console.log(`Using Imagen model: ${endpoint}`);
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
                model: actualModelId,
                endpoint,
                requestBody,
                response: data
            }
        };
    }

    /**
     * Main entry point for image generation.
     * @param model - Specific model string (e.g. 'gemini-2.0-flash-exp', 'imagen-3.0-generate-001') or generic 'gemini'/'imagen'.
     */
    async generateImage(
        prompt: string,
        style?: string,
        options?: {
            aspectRatio?: string,
            layout?: { elements: any[]; dimensions: { width: number; height: number; } },
            layoutImage?: string
        },
        model: string = 'gemini-2.0-flash-exp'
    ): Promise<{ imageBase64: string; finalPrompt: string; debugData?: any }> {
        this.getProjectId(); // Validate early

        const finalPrompt = this.buildLayoutPrompt(prompt, options);
        const lowerModel = model.toLowerCase();

        try {
            if (lowerModel.includes('imagen')) {
                return await this.generateWithImagen(prompt, finalPrompt, options, model);
            } else {
                // Default to Gemini for 'gemini' or any specific gemini model
                const modelId = lowerModel === 'gemini' ? 'gemini-2.0-flash-exp' : model;
                return await this.generateWithGemini(prompt, finalPrompt, options, modelId);
            }
        } catch (error) {
            console.error(`Error generating image with ${model}:`, error);
            throw error;
        }
    }

    /**
     * Enhance a prompt using Gemini.
     */
    async enhancePrompt(prompt: string, category: string): Promise<string> {
        const projectId = this.getProjectId();
        const headers = await this.getAuthHeaders();
        const modelId = 'gemini-2.0-flash-exp';
        const endpoint = `${this.baseUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;

        const systemInstruction = `You are a prompt engineering expert for AI image generation. 
Your goal is to take a simple user prompt and expand it into a detailed, high-quality prompt that will produce stunning results in an AI image generator (like Imagen or Gemini).
The user is generating an asset for a card game. The category is: ${category}.

Guidelines:
1. Maintain the user's original intent but add descriptive adjectives, lighting details, artistic style, and composition.
2. For backgrounds, focus on framing and atmosphere.
3. For icons, focus on clarity and stylized details.
4. For illustrations, focus on epic scale and cinematic qualities.
5. Provide ONLY the enhanced prompt text. No preamble, no explanations.
6. Do not include forbidden words (text, numbers, etc. if it's a background).
7. Keep it under 200 words.`;

        const requestBody = {
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 500,
            }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error during enhancement: ${errorText}`);
        }

        const data = await response.json();
        const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!enhancedText) {
            throw new Error('Failed to get enhanced prompt from Gemini');
        }

        return enhancedText.trim();
    }
}

export const googleAiService = new GoogleAiService();
