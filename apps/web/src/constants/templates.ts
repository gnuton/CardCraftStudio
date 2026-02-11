import type { DeckStyle } from '../types/deck';

export interface Template {
    id: string;
    name: string;
    style: DeckStyle;
    side?: 'front' | 'back' | 'both';
    isCustom?: boolean;
}

export const TEMPLATES: Template[] = [
    {
        id: 'simple',
        name: 'Simple Clean',
        side: 'front',
        style: {
            borderColor: '#e2e8f0',
            borderWidth: 2,
            backgroundColor: '#ffffff',
            backgroundImage: 'templates/simple.svg',
            globalFont: 'Outfit, sans-serif',
            gameHp: '', gameMana: '', gameSuit: '',
            svgFrameColor: '#e2e8f0',
            svgCornerColor: '#e2e8f0',
            svgStrokeWidth: 1,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: 0, y: -160, width: 240, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Outfit, sans-serif', fontSize: 20, color: '#1e293b', textAlign: 'center', defaultContent: 'Card Title'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -30, width: 250, height: 180, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 240, height: 80, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#475569', textAlign: 'left', defaultContent: 'Card description...'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'serif', fontSize: 24, color: '#1e293b', textAlign: 'center', defaultContent: 'CARDCRAFT'
                },
                {
                    id: 'corner', type: 'text', name: 'Cost', side: 'front',
                    x: -125, y: -185, width: 25, height: 25, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 12, color: '#000000', textAlign: 'center', defaultContent: '1'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Rarity', side: 'front',
                    x: 125, y: 185, width: 25, height: 25, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 12, color: '#000000', textAlign: 'center', defaultContent: '•'
                }
            ]
        }
    },
    {
        id: 'golden_era',
        name: 'Golden Era',
        side: 'front',
        style: {
            borderColor: '#B8860B',
            borderWidth: 12,
            backgroundColor: '#FDFCF0',
            backgroundImage: 'templates/golden_era.svg',
            globalFont: 'serif',
            gameHp: 'LVL', gameMana: '1', gameSuit: '★',
            svgFrameColor: '#B8860B',
            svgCornerColor: '#FFD700',
            svgStrokeWidth: 2,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: 0, y: -160, width: 230, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Georgia, serif', fontSize: 22, color: '#78350f', textAlign: 'center', defaultContent: 'Ancient Wisdom'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -30, width: 250, height: 180, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 230, height: 80, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Georgia, serif', fontSize: 13, color: '#451a03', textAlign: 'left', defaultContent: 'Knowledge from a forgotten time.'
                },
                {
                    id: 'corner', type: 'text', name: 'Cost', side: 'front',
                    x: -125, y: -185, width: 35, height: 35, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'serif', fontSize: 16, color: '#000000', textAlign: 'center', defaultContent: '1'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Rarity', side: 'front',
                    x: 125, y: 185, width: 35, height: 35, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'serif', fontSize: 16, color: '#000000', textAlign: 'center', defaultContent: 'R'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'serif', fontSize: 24, color: '#78350f', textAlign: 'center', defaultContent: 'ANCIENT'
                }
            ]
        }
    },
    {
        id: 'modern_blue',
        name: 'Modern Tech',
        side: 'front',
        style: {
            borderColor: '#0f172a',
            borderWidth: 10,
            backgroundColor: '#0f172a',
            backgroundImage: 'templates/modern_blue.svg',
            globalFont: 'sans-serif',
            gameHp: 'SYNC',
            gameMana: '50',
            gameSuit: 'Ω',
            svgFrameColor: '#38bdf8',
            svgCornerColor: '#1e293b',
            svgStrokeWidth: 2,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: 0, y: -160, width: 240, height: 40, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Outfit, sans-serif', fontSize: 20, color: '#f8fafc', textAlign: 'center', defaultContent: 'CYBER UNIT X'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -30, width: 260, height: 180, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 240, height: 80, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#94a3b8', textAlign: 'left', defaultContent: 'Protocol 7 initialized. Syncing data...'
                },
                {
                    id: 'corner', type: 'text', name: 'ID', side: 'front',
                    x: -125, y: -185, width: 30, height: 30, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'monospace', fontSize: 12, color: '#38bdf8', textAlign: 'center', defaultContent: '01'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Status', side: 'front',
                    x: 125, y: 185, width: 35, height: 35, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'monospace', fontSize: 12, color: '#38bdf8', textAlign: 'center', defaultContent: 'OK'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 24, color: '#38bdf8', textAlign: 'center', defaultContent: 'NETWORK'
                }
            ]
        }
    },
    {
        id: 'eldritch_archive',
        name: 'Eldritch Archive',
        side: 'front',
        style: {
            borderColor: '#2e102e',
            borderWidth: 12,
            backgroundColor: '#1a0a1a',
            backgroundImage: 'templates/eldritch_archive.svg',
            globalFont: 'serif',
            gameHp: 'OCCULT',
            gameMana: 'Ω',
            gameSuit: '♆',
            svgFrameColor: '#6a1b9a',
            svgCornerColor: '#ba68c8',
            svgStrokeWidth: 3,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: 0, y: -160, width: 230, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'serif', fontSize: 20, color: '#e1bee7', textAlign: 'center', defaultContent: 'The Unspeakable'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -30, width: 250, height: 180, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 240, height: 80, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'serif', fontSize: 13, color: '#ce93d8', textAlign: 'left', defaultContent: 'What lies beyond the veil is not meant for mortal eyes.'
                },
                {
                    id: 'corner', type: 'text', name: 'Type', side: 'front',
                    x: -25, y: 77.5, width: 200, height: 25, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'serif', fontSize: 12, color: '#ffffff', textAlign: 'left', defaultContent: 'Legendary Horror'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Seal', side: 'front',
                    x: 115, y: 175, width: 40, height: 40, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'serif', fontSize: 18, color: '#ba68c8', textAlign: 'center', defaultContent: '☥'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'serif', fontSize: 24, color: '#ba68c8', textAlign: 'center', defaultContent: 'ELDRIITCH'
                }
            ]
        }
    },
    {
        id: 'neon_data',
        name: 'Neon Cyber',
        side: 'front',
        style: {
            borderColor: '#050505',
            borderWidth: 10,
            backgroundColor: '#050505',
            backgroundImage: 'templates/neon_data.svg',
            globalFont: 'sans-serif',
            gameHp: 'NET',
            gameMana: 'PWR',
            gameSuit: '↯',
            svgFrameColor: '#00f0ff',
            svgCornerColor: '#7000ff',
            svgStrokeWidth: 2,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: -15, y: -160, width: 210, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'monospace', fontSize: 18, color: '#00f0ff', textAlign: 'left', defaultContent: 'DATA_GHOST'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -30, width: 260, height: 180, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 250, height: 90, rotate: 0, scale: 1, zIndex: 10, opacity: 0.9,
                    fontFamily: 'monospace', fontSize: 12, color: '#00f0ff', textAlign: 'left', defaultContent: 'Buffer overflow detected. System corrupted.'
                },
                {
                    id: 'corner', type: 'text', name: 'ID', side: 'front',
                    x: 120, y: -175, width: 30, height: 30, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'monospace', fontSize: 14, color: '#00f0ff', textAlign: 'center', defaultContent: 'X'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Core', side: 'front',
                    x: 125, y: 180, width: 25, height: 35, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'monospace', fontSize: 14, color: '#7000ff', textAlign: 'center', defaultContent: 'A'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'monospace', fontSize: 24, color: '#7000ff', textAlign: 'center', defaultContent: 'NEON'
                }
            ]
        }
    },
    {
        id: 'pocket_monster',
        name: 'Monster Card',
        side: 'front',
        style: {
            borderColor: '#f59e0b',
            borderWidth: 12,
            backgroundColor: '#fbbf24',
            backgroundImage: 'templates/pocket_monster.svg',
            globalFont: 'sans-serif',
            gameHp: '60',
            gameMana: 'HP',
            gameSuit: '⚡',
            svgFrameColor: '#f59e0b',
            svgCornerColor: '#ef4444',
            svgStrokeWidth: 2,
            elements: [
                {
                    id: 'title', type: 'text', name: 'Title', side: 'front',
                    x: -30, y: -165, width: 180, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 20, color: '#1e293b', textAlign: 'left', defaultContent: 'Pikabolt'
                },
                {
                    id: 'art', type: 'image', name: 'Illustration', side: 'front',
                    x: 0, y: -40, width: 260, height: 170, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                    url: ''
                },
                {
                    id: 'description', type: 'multiline', name: 'Description', side: 'front',
                    x: 0, y: 130, width: 250, height: 95, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 13, color: '#1e293b', textAlign: 'left', defaultContent: 'Thunder Shock: Flip a coin.'
                },
                {
                    id: 'corner', type: 'text', name: 'HP', side: 'front',
                    x: 110, y: -165, width: 30, height: 30, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 14, color: '#ffffff', textAlign: 'center', defaultContent: '60'
                },
                {
                    id: 'reversedCorner', type: 'text', name: 'Footer', side: 'front',
                    x: -100, y: 190, width: 100, height: 15, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 10, color: '#000000', textAlign: 'left', defaultContent: 'Basic Monster'
                },
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'sans-serif', fontSize: 24, color: '#ef4444', textAlign: 'center', defaultContent: 'MONSTER'
                }
            ]
        }
    },
    {
        id: 'empty',
        name: 'Empty Canvas',
        side: 'both',
        style: {
            borderColor: '#e2e8f0',
            borderWidth: 1,
            backgroundColor: '#ffffff',
            backgroundImage: 'templates/empty.svg',
            globalFont: 'sans-serif',
            gameHp: '',
            gameMana: '',
            gameSuit: '',
            svgFrameColor: '#e2e8f0',
            svgCornerColor: '#e2e8f0',
            svgStrokeWidth: 1,
            elements: []
        }
    },
    // --- Back Templates ---
    {
        id: 'royal_back',
        name: 'Royal Back',
        side: 'back',
        style: {
            borderColor: '#4338ca',
            borderWidth: 12,
            backgroundColor: '#1e1b4b',
            cardBackBackgroundColor: '#1e1b4b',
            cardBackImage: null,
            elements: [
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'serif', fontSize: 24, color: '#e0e7ff', textAlign: 'center', defaultContent: 'ROYAL DECK'
                }
            ]
        } as DeckStyle
    },
    {
        id: 'mystic_back',
        name: 'Mystic Seal',
        side: 'back',
        style: {
            borderColor: '#1a1b1e',
            borderWidth: 10,
            backgroundColor: '#2c2e33',
            cardBackBackgroundColor: '#2c2e33',
            cardBackImage: null,
            elements: [
                {
                    id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                    x: 0, y: -100, width: 250, height: 40, rotate: 0, scale: 1.2, zIndex: 30, opacity: 1,
                    fontFamily: 'serif', fontSize: 28, color: '#d0ebff', textAlign: 'center', defaultContent: 'MYSTERY'
                },
                {
                    id: 'seal', type: 'text', name: 'Seal', side: 'back',
                    x: 0, y: 50, width: 100, height: 100, rotate: 0, scale: 2, zIndex: 30, opacity: 0.5,
                    fontFamily: 'serif', fontSize: 48, color: '#d0ebff', textAlign: 'center', defaultContent: '✧'
                }
            ]
        } as DeckStyle
    },
    {
        id: 'cyber_back',
        name: 'Data Grid',
        side: 'back',
        style: {
            borderColor: '#0f172a',
            borderWidth: 8,
            backgroundColor: '#020617',
            cardBackBackgroundColor: '#020617',
            cardBackImage: null,
            elements: [
                {
                    id: 'back_title', type: 'text', name: 'Header', side: 'back',
                    x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                    fontFamily: 'monospace', fontSize: 24, color: '#38bdf8', textAlign: 'center', defaultContent: 'SYSTEM.BACK'
                }
            ]
        } as DeckStyle
    }
];
