import express from 'express';
import { assetService } from '../services/assetService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/assets - List all assets for user
 */
router.get('/', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const filters = {
            source: req.query.source as any,
            category: req.query.category as any,
            search: req.query.search as string,
            tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
            sortBy: (req.query.sortBy as any) || 'createdAt',
            sortOrder: (req.query.sortOrder as any) || 'desc',
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
        };

        const result = await assetService.listAssets(userId, filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/assets/:id - Get specific asset
 */
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const asset = await assetService.getAsset(assetId, userId);
        res.json({ asset });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/assets/import - Import asset from URL
 */
router.post('/import', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const { url, source, ...metadata } = req.body;

        if (!url || !source) {
            throw new ApiError(400, 'Bad Request', 'URL and source are required');
        }

        const asset = await assetService.importFromUrl(url, userId, {
            source,
            ...metadata
        });

        res.status(201).json({
            asset,
            message: 'Asset imported successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/assets - Create new asset
 */
router.post('/', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const { imageData, fileName, source, mimeType, tags, category } = req.body;

        if (!imageData || !fileName || !source) {
            throw new ApiError(
                400,
                'Bad Request',
                'imageData, fileName, and source are required'
            );
        }

        if (!['uploaded', 'searched', 'generated'].includes(source)) {
            throw new ApiError(
                400,
                'Bad Request',
                'source must be "uploaded", "searched", or "generated"'
            );
        }

        const asset = await assetService.createAsset({
            userId,
            imageData,
            fileName,
            source,
            mimeType,
            tags,
            category,
        });

        res.status(201).json({
            asset,
            message: 'Asset created successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/assets/:id - Update asset metadata
 */
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const { fileName, tags, category } = req.body;

        const updates: any = {};
        if (fileName !== undefined) updates.fileName = fileName;
        if (tags !== undefined) updates.tags = tags;
        if (category !== undefined) updates.category = category;

        const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const asset = await assetService.updateAsset(
            assetId,
            userId,
            updates
        );

        res.json({
            asset,
            message: 'Asset updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/assets/:id - Delete asset
 */
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await assetService.deleteAsset(assetId, userId);

        res.json({
            message: 'Asset deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/assets/:id/use - Increment usage count
 */
router.post('/:id/use', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await assetService.incrementUsage(assetId, userId);

        res.json({
            message: 'Usage count updated',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/assets/:id/data - Get asset image data URL
 */
router.get('/:id/data', async (req: AuthenticatedRequest, res, next) => {
    try {
        const userId = req.user!.uid;
        const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const asset = await assetService.getAsset(assetId, userId);
        const dataUrl = await assetService.getAssetDataUrl(asset.driveFileId, userId);

        res.json({ dataUrl });
    } catch (error) {
        next(error);
    }
});

export const assetRouter = router;
