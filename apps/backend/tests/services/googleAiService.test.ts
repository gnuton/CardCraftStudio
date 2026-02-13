import { googleAiService } from '../../src/services/googleAiService';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

describe('GoogleAiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
        process.env.GOOGLE_API_KEY = 'test-key';
    });

    afterEach(() => {
        delete process.env.GOOGLE_CLOUD_PROJECT;
        delete process.env.GOOGLE_API_KEY;
    });

    describe('Imagen model', () => {
        it('should generate image with Imagen and return base64', async () => {
            const mockImageBytes = 'base64encodedimage';
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    predictions: [{
                        bytesBase64Encoded: mockImageBytes
                    }]
                })
            });

            const result = await googleAiService.generateImage('a dragon', undefined, undefined, 'imagen');

            expect(mockedFetch).toHaveBeenCalledTimes(1);
            expect(result.imageBase64).toBe(`data:image/png;base64,${mockImageBytes}`);
            expect(result.finalPrompt).toBe('a dragon');
        });

        it('should handle Imagen API errors', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                text: async () => 'Forbidden'
            });

            await expect(googleAiService.generateImage('test', undefined, undefined, 'imagen'))
                .rejects.toThrow('Imagen API error: 403 Forbidden');
        });

        it('should use capability model when layoutImage is provided with Imagen', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    predictions: [{ bytesBase64Encoded: 'mock-image-base64' }]
                })
            });

            const result = await googleAiService.generateImage('test prompt', undefined, {
                layoutImage: 'data:image/png;base64,mock-wireframe'
            }, 'imagen');

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

    describe('Gemini model', () => {
        it('should generate image with Gemini Flash and return base64', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [
                                { inlineData: { mimeType: 'image/png', data: 'gemini-image-base64' } },
                                { text: 'Here is the generated image.' }
                            ]
                        }
                    }]
                })
            });

            const result = await googleAiService.generateImage('a forest', undefined, undefined, 'gemini');

            expect(mockedFetch).toHaveBeenCalledTimes(1);
            expect(result.imageBase64).toBe('data:image/png;base64,gemini-image-base64');
            expect(result.finalPrompt).toBe('a forest');
            expect(result.debugData?.model).toBe('gemini-2.0-flash-exp');
        });

        it('should use Gemini as default model', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: 'default-model-image' } }
                            ]
                        }
                    }]
                })
            });

            // No model specified - should default to gemini
            const result = await googleAiService.generateImage('sunset', undefined);

            expect(mockedFetch).toHaveBeenCalledWith(
                expect.stringContaining('gemini-2.0-flash-exp:generateContent'),
                expect.any(Object)
            );
            expect(result.imageBase64).toBe('data:image/jpeg;base64,default-model-image');
        });

        it('should handle Gemini API errors', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error'
            });

            await expect(googleAiService.generateImage('test', undefined, undefined, 'gemini'))
                .rejects.toThrow('Gemini API error (500 Internal Server Error): Server error');
        });

        it('should throw if Gemini returns no image part', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [
                                { text: 'Sorry, I could not generate an image.' }
                            ]
                        }
                    }]
                })
            });

            await expect(googleAiService.generateImage('test', undefined, undefined, 'gemini'))
                .rejects.toThrow('Gemini refused to generate image');
        });

        it('should call generateContent endpoint with correct request body', async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [
                                { inlineData: { mimeType: 'image/png', data: 'abc' } }
                            ]
                        }
                    }]
                })
            });

            await googleAiService.generateImage('test prompt', undefined, undefined, 'gemini');

            const [url, fetchOptions] = mockedFetch.mock.calls[0];
            expect(url).toContain('gemini-2.0-flash-exp:generateContent');
            const body = JSON.parse(fetchOptions.body);
            expect(body.contents[0].parts[0].text).toBe('test prompt');
            expect(body.generationConfig.responseModalities).toEqual(['IMAGE']);
        });
    });

    it('should throw if GOOGLE_CLOUD_PROJECT is not set', async () => {
        delete process.env.GOOGLE_CLOUD_PROJECT;

        await expect(googleAiService.generateImage('test'))
            .rejects.toThrow('Server configuration error');
    });
});
