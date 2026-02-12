import { googleImagenService } from '../../src/services/googleImagen';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

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
        expect(result.imageBase64).toBe(`data:image/png;base64,${mockImageBytes}`);
        expect(result.finalPrompt).toBe('a dragon');
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

    it('should use capability model when layoutImage is provided', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                predictions: [{ bytesBase64Encoded: 'mock-image-base64' }]
            })
        });

        const result = await googleImagenService.generateImage('test prompt', undefined, {
            layoutImage: 'data:image/png;base64,mock-wireframe'
        });

        expect(result.imageBase64).toBe('data:image/png;base64,mock-image-base64');
        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('imagen-3.0-capability-001:predict'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"referenceType":"REFERENCE_TYPE_CONTROL"'),
            })
        );
        expect(mockedFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"controlType":"CONTROL_TYPE_CANNY"'),
            })
        );
    });
});
