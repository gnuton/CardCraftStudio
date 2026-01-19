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

    async generateImage(prompt: string, style?: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/images/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, style }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        const data = await response.json();
        return data.imageBase64;
    }
}

export const imageProviderService = new ImageProviderService();
