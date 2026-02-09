import { googleImagenService } from '../../src/services/googleImagen';

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('GoogleImagenService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
        process.env.GOOGLE_API_KEY = 'test-key';
    });

    afterEach(() => {
        delete process.env.GOOGLE_CLOUD_PROJECT;
        delete process.env.GOOGLE_API_KEY;
    });

    it('should generate image and return base64', async () => {
        const mockImageBytes = 'base64encodedimage';
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                predictions: [{
                    bytesBase64Encoded: mockImageBytes
                }]
            })
        });

        const result = await googleImagenService.generateImage('a dragon', 'fantasy');

        expect(mockedFetch).toHaveBeenCalledTimes(1);
        expect(result).toBe(`data:image/png;base64,${mockImageBytes}`);
    });

    it('should handle API errors', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            text: async () => 'Forbidden'
        });

        await expect(googleImagenService.generateImage('test', 'fantasy'))
            .rejects.toThrow('Imagen API error: 403 Forbidden');
    });
});
