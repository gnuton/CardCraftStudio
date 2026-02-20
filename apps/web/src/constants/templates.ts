import type { DeckStyle } from '../types/deck';
import { createOfficialTemplate, type DeckTemplate } from '../types/template';

export const TEMPLATES: DeckTemplate[] = [
    // ──────────────────────────────────────────────
    //  CARD LAYOUT TEMPLATES
    // ──────────────────────────────────────────────

    createOfficialTemplate('blank', 'Blank Card', {
        borderColor: '#d1d5db',
        borderWidth: 1,
        backgroundColor: '#ffffff',
        backgroundImage: null,
        globalFont: 'sans-serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#d1d5db',
        svgCornerColor: '#d1d5db',
        svgStrokeWidth: 0,
        elements: []
    }, 'both', {
        description: 'A completely blank card for full customization. Add your own elements from scratch.',
        category: 'Card Layouts',
    }),

    createOfficialTemplate('story_card', 'Story Card', {
        borderColor: '#a16207',
        borderWidth: 8,
        backgroundColor: '#fef3c7',
        backgroundImage: null,
        globalFont: 'Georgia, serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#a16207',
        svgCornerColor: '#d97706',
        svgStrokeWidth: 1.5,
        elements: [
            {
                id: 'title', type: 'text', name: 'Title', side: 'front',
                x: 0, y: -175, width: 260, height: 40, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 22, color: '#78350f', textAlign: 'center', defaultContent: 'The Journey Begins'
            },
            {
                id: 'art', type: 'image', name: 'Illustration', side: 'front',
                x: 0, y: -40, width: 280, height: 200, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                url: ''
            },
            {
                id: 'description', type: 'multiline', name: 'Description', side: 'front',
                x: 0, y: 140, width: 270, height: 100, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 13, color: '#451a03', textAlign: 'left', defaultContent: 'A mysterious path unfolds before you, leading deep into the ancient forest...'
            },
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 24, color: '#78350f', textAlign: 'center', defaultContent: 'STORY'
            }
        ]
    }, 'front', {
        description: 'Large illustration with title and description. Perfect for story, event, and simple game cards.',
        category: 'Card Layouts',
    }),

    createOfficialTemplate('tcg_standard', 'TCG Standard', {
        borderColor: '#1e1b4b',
        borderWidth: 10,
        backgroundColor: '#1e1b4b',
        backgroundImage: null,
        globalFont: 'sans-serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#6366f1',
        svgCornerColor: '#312e81',
        svgStrokeWidth: 2,
        elements: [
            {
                id: 'title', type: 'text', name: 'Title', side: 'front',
                x: -20, y: -175, width: 200, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 18, color: '#e0e7ff', textAlign: 'left', defaultContent: 'Shadow Knight'
            },
            {
                id: 'cost', type: 'text', name: 'Cost', side: 'front',
                x: 130, y: -178, width: 30, height: 30, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 18, color: '#fbbf24', textAlign: 'center',
                backgroundColor: '#312e81', defaultContent: '3'
            },
            {
                id: 'art', type: 'image', name: 'Illustration', side: 'front',
                x: 0, y: -70, width: 280, height: 160, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                url: ''
            },
            {
                id: 'type_label', type: 'text', name: 'Type', side: 'front',
                x: 0, y: 22, width: 270, height: 22, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 11, color: '#a5b4fc', textAlign: 'center',
                backgroundColor: '#312e81', defaultContent: 'Creature — Undead Warrior'
            },
            {
                id: 'description', type: 'multiline', name: 'Ability Text', side: 'front',
                x: 0, y: 95, width: 270, height: 80, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 12, color: '#c7d2fe', textAlign: 'left', defaultContent: '<b>Strike:</b> Deal 3 damage to target creature. If it is destroyed, gain +1/+1.'
            },
            {
                id: 'stat_atk', type: 'text', name: 'ATK', side: 'front',
                x: -120, y: 190, width: 40, height: 28, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 16, color: '#fbbf24', textAlign: 'center',
                backgroundColor: '#312e81', defaultContent: '3'
            },
            {
                id: 'stat_def', type: 'text', name: 'DEF', side: 'front',
                x: 120, y: 190, width: 40, height: 28, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 16, color: '#60a5fa', textAlign: 'center',
                backgroundColor: '#312e81', defaultContent: '4'
            },
            {
                id: 'footer', type: 'text', name: 'Footer', side: 'front',
                x: 0, y: 195, width: 140, height: 15, rotate: 0, scale: 1, zIndex: 10, opacity: 0.6,
                fontFamily: 'sans-serif', fontSize: 8, color: '#818cf8', textAlign: 'center', defaultContent: 'SET-001 · Rare'
            },
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'sans-serif', fontSize: 24, color: '#818cf8', textAlign: 'center', defaultContent: 'TCG'
            }
        ]
    }, 'front', {
        description: 'Classic trading card layout with cost, illustration, type, ability text, and ATK/DEF stats.',
        category: 'Card Layouts',
    }),

    createOfficialTemplate('minimal_icon', 'Minimal Icon', {
        borderColor: '#e2e8f0',
        borderWidth: 4,
        backgroundColor: '#f8fafc',
        backgroundImage: null,
        globalFont: 'Inter, sans-serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#cbd5e1',
        svgCornerColor: '#e2e8f0',
        svgStrokeWidth: 1,
        elements: [
            {
                id: 'icon', type: 'image', name: 'Icon', side: 'front',
                x: 0, y: -60, width: 160, height: 160, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
                url: ''
            },
            {
                id: 'title', type: 'text', name: 'Title', side: 'front',
                x: 0, y: 70, width: 240, height: 35, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Inter, sans-serif', fontSize: 20, color: '#0f172a', textAlign: 'center', defaultContent: 'Gold Coin'
            },
            {
                id: 'description', type: 'text', name: 'Description', side: 'front',
                x: 0, y: 110, width: 240, height: 25, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', textAlign: 'center', defaultContent: 'Worth 100 credits'
            },
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'Inter, sans-serif', fontSize: 20, color: '#64748b', textAlign: 'center', defaultContent: 'ITEM'
            }
        ]
    }, 'front', {
        description: 'Centered icon with title and short description. Ideal for resource, status, and item cards.',
        category: 'Card Layouts',
    }),

    createOfficialTemplate('full_art', 'Full Art', {
        borderColor: '#000000',
        borderWidth: 0,
        backgroundColor: '#111111',
        backgroundImage: null,
        globalFont: 'Outfit, sans-serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#111111',
        svgCornerColor: '#111111',
        svgStrokeWidth: 0,
        elements: [
            {
                id: 'art', type: 'image', name: 'Full Illustration', side: 'front',
                x: 0, y: 0, width: 375, height: 525, rotate: 0, scale: 1, zIndex: 1, opacity: 1,
                url: ''
            },
            {
                id: 'title', type: 'text', name: 'Title Overlay', side: 'front',
                x: 0, y: 170, width: 300, height: 40, rotate: 0, scale: 1, zIndex: 20, opacity: 0.95,
                fontFamily: 'Outfit, sans-serif', fontSize: 24, color: '#ffffff', textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)', defaultContent: 'Ethereal Visions'
            },
            {
                id: 'description', type: 'text', name: 'Subtitle Overlay', side: 'front',
                x: 0, y: 210, width: 250, height: 25, rotate: 0, scale: 1, zIndex: 20, opacity: 0.8,
                fontFamily: 'Outfit, sans-serif', fontSize: 12, color: '#d1d5db', textAlign: 'center', defaultContent: 'Legendary · Mythic'
            },
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'Outfit, sans-serif', fontSize: 24, color: '#ffffff', textAlign: 'center', defaultContent: 'GALLERY'
            }
        ]
    }, 'front', {
        description: 'Full-bleed illustration with transparent title overlay. For modern digital card games.',
        category: 'Card Layouts',
    }),

    createOfficialTemplate('text_focused', 'Text Card', {
        borderColor: '#78716c',
        borderWidth: 6,
        backgroundColor: '#fafaf9',
        backgroundImage: null,
        globalFont: 'Georgia, serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#a8a29e',
        svgCornerColor: '#d6d3d1',
        svgStrokeWidth: 1,
        elements: [
            {
                id: 'title', type: 'text', name: 'Title', side: 'front',
                x: 0, y: -180, width: 270, height: 45, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 24, color: '#1c1917', textAlign: 'center', defaultContent: 'Rule of Three'
            },
            {
                id: 'divider', type: 'text', name: 'Divider', side: 'front',
                x: 0, y: -148, width: 200, height: 12, rotate: 0, scale: 1, zIndex: 10, opacity: 0.3,
                fontFamily: 'serif', fontSize: 10, color: '#78716c', textAlign: 'center', defaultContent: '━━━━━━━━━━━━━━━━━━'
            },
            {
                id: 'description', type: 'multiline', name: 'Main Text', side: 'front',
                x: 0, y: 20, width: 280, height: 300, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 14, color: '#292524', textAlign: 'left', defaultContent: 'Each player draws three cards from the top of their deck. For each card drawn, the player may choose to keep it or discard it.\n\nCards that are discarded are placed face-up in the common pool and may be claimed by any other player on their next turn.'
            },
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'Georgia, serif', fontSize: 22, color: '#78716c', textAlign: 'center', defaultContent: 'RULES'
            }
        ]
    }, 'front', {
        description: 'Title and large text area with no illustration. Perfect for rule, narrative, and event cards.',
        category: 'Card Layouts',
    }),


    // ──────────────────────────────────────────────
    //  BACK TEMPLATES
    // ──────────────────────────────────────────────

    createOfficialTemplate('royal_back', 'Royal Back', {
        borderColor: '#4338ca',
        borderWidth: 12,
        backgroundColor: '#1e1b4b',
        cardBackBackgroundColor: '#1e1b4b',
        cardBackImage: null,
        // Added to satisfy Zod schema
        backgroundImage: null,
        globalFont: 'serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#4338ca', svgCornerColor: '#4338ca', svgStrokeWidth: 0,
        elements: [
            {
                id: 'back_title', type: 'text', name: 'Game Title', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'serif', fontSize: 24, color: '#e0e7ff', textAlign: 'center', defaultContent: 'ROYAL DECK'
            }
        ]
    } as DeckStyle, 'back', { category: 'Back Designs' }),

    createOfficialTemplate('mystic_back', 'Mystic Seal', {
        borderColor: '#1a1b1e',
        borderWidth: 10,
        backgroundColor: '#2c2e33',
        cardBackBackgroundColor: '#2c2e33',
        cardBackImage: null,
        // Added to satisfy Zod schema
        backgroundImage: null,
        globalFont: 'serif',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#1a1b1e', svgCornerColor: '#1a1b1e', svgStrokeWidth: 0,
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
    } as DeckStyle, 'back', { category: 'Back Designs' }),

    createOfficialTemplate('cyber_back', 'Data Grid', {
        borderColor: '#0f172a',
        borderWidth: 8,
        backgroundColor: '#020617',
        cardBackBackgroundColor: '#020617',
        cardBackImage: null,
        // Added to satisfy Zod schema
        backgroundImage: null,
        globalFont: 'monospace',
        gameHp: '', gameMana: '', gameSuit: '',
        svgFrameColor: '#0f172a', svgCornerColor: '#0f172a', svgStrokeWidth: 0,
        elements: [
            {
                id: 'back_title', type: 'text', name: 'Header', side: 'back',
                x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
                fontFamily: 'monospace', fontSize: 24, color: '#38bdf8', textAlign: 'center', defaultContent: 'SYSTEM.BACK'
            }
        ]
    } as DeckStyle, 'back', { category: 'Back Designs' }),
];
