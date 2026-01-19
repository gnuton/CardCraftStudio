import express from 'express';
import { googleSearchService } from '../services/googleSearch';
import { googleImagenService } from '../services/googleImagen';
import { requirePremium } from '../middleware/requirePremium';

const router = express.Router();

router.post('/search', async (req, res) => {
    try {
        const { query, page } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const pageNum = Number(page) || 1;
        const pageSize = 10;
        const results = await googleSearchService.searchImages(query, pageNum, pageSize);
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search images' });
    }
});

router.post('/generate', requirePremium, async (req, res) => {
    try {
        const { prompt, style } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const imageBase64 = await googleImagenService.generateImage(prompt, style);
        res.json({ imageBase64, prompt });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

export const imageRouter = router;
