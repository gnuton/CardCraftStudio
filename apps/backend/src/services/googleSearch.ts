export interface ImageResult {
    url: string;
    thumbnail: string;
    title: string;
    contextLink?: string;
}

interface GoogleSearchItem {
    link: string;
    title: string;
    image: {
        thumbnailLink: string;
        contextLink: string;
    };
}

class GoogleSearchService {
    private baseUrl = 'https://customsearch.googleapis.com/customsearch/v1';

    async searchImages(query: string, page: number = 1, pageSize: number = 10): Promise<ImageResult[]> {
        const apiKey = process.env.GOOGLE_API_KEY;
        const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

        if (!apiKey || !cx) {
            console.error('Missing Google API credentials');
            throw new Error('Server configuration error');
        }

        const start = (page - 1) * pageSize + 1;
        const url = new URL(this.baseUrl);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('cx', cx);
        url.searchParams.append('q', query);
        url.searchParams.append('searchType', 'image');
        url.searchParams.append('num', pageSize.toString());
        url.searchParams.append('start', start.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items) {
            return [];
        }

        return (data.items as GoogleSearchItem[]).map(item => ({
            url: item.link,
            thumbnail: item.image.thumbnailLink,
            title: item.title,
            contextLink: item.image.contextLink
        }));
    }
}

export const googleSearchService = new GoogleSearchService();
