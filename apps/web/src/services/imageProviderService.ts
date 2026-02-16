import { getAuthToken } from '../contexts/AuthContext';

class ImageProviderService {
    private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    async generateImage(
        prompt: string,
        _style?: string, // Legacy, kept for backward compatibility but ignored
        options?: {
            saveToAssets?: boolean;
            assetMetadata?: any;
            aspectRatio?: string;
            layout?: { elements: any[]; dimensions: { width: number; height: number; } };
            layoutImage?: string;
            model?: string;
        }
    ): Promise<{ imageBase64: string; prompt: string; asset?: any; model?: string }> {
        const token = getAuthToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token is available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}/api/images/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                prompt,
                // style parameter removed from body
                saveToAssets: options?.saveToAssets,
                assetMetadata: options?.assetMetadata,
                aspectRatio: options?.aspectRatio,
                layout: options?.layout,
                layoutImage: options?.layoutImage,
                model: options?.model
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.userMessage || errorData.error || 'Failed to generate image';
            throw new Error(message);
        }

        const data = await response.json();
        return data;
    }

    async enhancePrompt(prompt: string, category: string): Promise<{ enhancedPrompt: string }> {
        const token = getAuthToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}/api/images/enhance-prompt`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, category }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to enhance prompt');
        }

        return await response.json();
    }
}

export const imageProviderService = new ImageProviderService();
