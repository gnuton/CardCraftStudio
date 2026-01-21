import type { CardElement } from './element';

export interface DeckStyle {
    // Global Styling
    borderColor: string;
    borderWidth: number;
    backgroundColor: string;
    backgroundImage: string | null;
    globalFont?: string;
    layoutMode?: 'flow' | 'absolute';

    // Game Logic / Overlay
    gameHp: string;
    gameMana: string;
    gameSuit: string;

    // SVG Styling
    svgFrameColor: string;
    svgCornerColor: string;
    svgStrokeWidth: number;

    // Dynamic Elements
    elements: CardElement[];

    id?: string;
    isLocked?: boolean;

    // Back Styling
    cardBackBackgroundColor?: string;
    cardBackImage?: string | null;

    // Card Size
    cardSizePreset?: 'poker' | 'bridge' | 'tarot' | 'mini' | 'euro' | 'square' | 'custom';
    cardWidth?: number;
    cardHeight?: number;
}
