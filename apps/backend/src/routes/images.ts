import express from 'express';
import { googleSearchService } from '../services/googleSearch';
import { googleImagenService } from '../services/googleImagen';
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
        const { prompt, style } = req.body;

        if (!prompt) {
            throw new ApiError(400, 'Prompt is required', 'The "prompt" field is missing in the request body.');
        }

        const imageBase64 = await googleImagenService.generateImage(prompt, style);
        res.json({ imageBase64, prompt });
    } catch (error) {
        next(error);
    }
});

export const imageRouter = router;
