import { getAuthToken } from '../contexts/AuthContext';

export interface ImageResult {
    url: string;
    thumbnail: string;
    title: string;
    contextLink?: string;
}

class ImageProviderService {
    private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    async searchImages(query: string, page: number = 1): Promise<ImageResult[]> {
        const response = await fetch(`${this.baseUrl}/api/images/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, page }),
        });

        if (!response.ok) {
            throw new Error('Failed to search images');
        }

        const data = await response.json();
        return data.results;
    }

    async generateImage(
        prompt: string,
        style?: string,
        options?: { saveToAssets?: boolean; assetMetadata?: any }
    ): Promise<{ imageBase64: string; asset?: any }> {
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
                style,
                saveToAssets: options?.saveToAssets,
                assetMetadata: options?.assetMetadata
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
}

export const imageProviderService = new ImageProviderService();
