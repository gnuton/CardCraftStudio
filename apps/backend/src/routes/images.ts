import express from 'express';
import { googleSearchService } from '../services/googleSearch';
import { googleAiService } from '../services/googleAiService';
import { assetService } from '../services/assetService';
import { requirePremium } from '../middleware/requirePremium';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

router.post('/search', async (req, res, next) => {
    try {
        const { query, page } = req.body;

        if (!query) {
            throw new ApiError(400, 'Query is required', 'The "query" field is missing in the request body.');
        }

        const pageNum = Number(page) || 1;
        const pageSize = 10;
        const results = await googleSearchService.searchImages(query, pageNum, pageSize);
        res.json({ results });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Google Search API error')) {
            // Forward specific API errors with their status if we parsed them, 
            // otherwise default to 500 in the shared logic or rethrow wrapped
            // Ideally update the service to throw ApiError, but here we wrap:
            if (error.message.includes('403')) {
                return next(new ApiError(403, 'Search Provider Error', error.message));
            }
        }
        next(error);
    }
});

router.post('/generate', requirePremium, async (req, res, next) => {
    try {
        const { prompt, saveToAssets, assetMetadata, aspectRatio, layout, layoutImage, model } = req.body;

        if (!prompt) {
            throw new ApiError(400, 'Prompt is required', 'The "prompt" field is missing in the request body.');
        }

        // Determine model: non-admin users are forced to 'gemini'
        const user = (req as any).user;
        const isAdmin = user?.plan === 'admin';
        const resolvedModel = isAdmin && model === 'imagen' ? 'imagen' : 'gemini';

        const { imageBase64, finalPrompt, debugData } = await googleAiService.generateImage(prompt, undefined, {
            aspectRatio,
            layout,
            layoutImage
        }, resolvedModel);

        // If saveToAssets is requested, save to Asset Manager
        let asset;
        if (saveToAssets && user) {
            try {
                const imageData = imageBase64.includes(',') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

                asset = await assetService.createAsset({
                    userId: user.uid,
                    imageData,
                    fileName: assetMetadata?.fileName || `${prompt.substring(0, 50)}`,
                    source: 'generated',
                    category: assetMetadata?.category || 'main-illustration', // Pass category
                    prompt: finalPrompt,
                    // style removed
                    tags: assetMetadata?.tags || ['ai-generated'],
                    mimeType: 'image/png',
                });

                console.log(`[ImageGen] Saved generated image to assets: ${asset.id}`);
            } catch (err) {
                console.error('[ImageGen] Failed to save to assets:', err);
                // Don't fail the request if asset save fails
            }
        }

        res.json({
            imageBase64,
            prompt: finalPrompt,
            asset, // Include asset if it was created
            debugData,
            model: resolvedModel // Tell the frontend which model was actually used
        });
    } catch (error) {
        next(error);
    }
});

export const imageRouter = router;
