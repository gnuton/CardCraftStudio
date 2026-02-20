import { z } from 'zod';
import type { DeckStyle } from './deck';
import type { CardElement } from './element';

// --- Zod Schemas ---

export const CardElementSchema: z.ZodType<CardElement> = z.object({
    id: z.string(),
    type: z.enum(['text', 'multiline', 'image']),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotate: z.number(),
    scale: z.number(),
    zIndex: z.number(),
    opacity: z.number(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderWidth: z.number().optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    defaultContent: z.string().optional(),
    url: z.string().nullable().optional(),
    overlayUrl: z.string().nullable().optional(),
    isLocked: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    side: z.enum(['front', 'back']),
});

export const DeckStyleSchema: z.ZodType<DeckStyle> = z.object({
    borderColor: z.string(),
    borderWidth: z.number(),
    backgroundColor: z.string(),
    backgroundImage: z.string().nullable(),
    globalFont: z.string().optional(),
    layoutMode: z.enum(['flow', 'absolute']).optional(),
    gameHp: z.string(),
    gameMana: z.string(),
    gameSuit: z.string(),
    svgFrameColor: z.string(),
    svgCornerColor: z.string(),
    svgStrokeWidth: z.number(),
    elements: z.array(CardElementSchema),
    id: z.string().optional(),
    isLocked: z.boolean().optional(),
    cardBackBackgroundColor: z.string().optional(),
    cardBackImage: z.string().nullable().optional(),
    cardSizePreset: z.enum(['poker', 'bridge', 'tarot', 'mini', 'euro', 'square', 'custom']).optional(),
    cardWidth: z.number().optional(),
    cardHeight: z.number().optional(),
});

export const DeckTemplateSchema = z.object({
    id: z.string(),
    version: z.number(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    author: z.string().optional(),
    isOfficial: z.boolean(),
    style: DeckStyleSchema,
    side: z.enum(['front', 'back', 'both']).optional(),
    thumbnailUrl: z.string().optional(),
});

// --- TypeScript Interface (derived from schema) ---

export type DeckTemplate = z.infer<typeof DeckTemplateSchema>;

// --- Validation ---

/**
 * Safely parse an unknown JSON value into a DeckTemplate.
 * Returns null if validation fails.
 */
export function safeParseDeckTemplate(json: unknown): DeckTemplate | null {
    const result = DeckTemplateSchema.safeParse(json);
    if (result.success) {
        return result.data;
    }
    console.warn('DeckTemplate validation failed:', result.error.format());
    return null;
}

// --- Factory for Official Templates ---

export function createOfficialTemplate(
    id: string,
    name: string,
    style: DeckStyle,
    side?: 'front' | 'back' | 'both',
    options?: { description?: string; category?: string },
): DeckTemplate {
    return {
        id,
        version: 1,
        name,
        description: options?.description,
        category: options?.category,
        isOfficial: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        style,
        side,
    };
}
