// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templateStorageService } from './templateStorageService';
import type { DeckTemplate } from '../types/template';
import type { DeckStyle } from '../types/deck';

// Mock Google Drive service
vi.mock('./googleDrive', () => ({
    driveService: {
        get isSignedIn() { return false; },
        listFiles: vi.fn(),
        getFileContent: vi.fn(),
        saveBlob: vi.fn(),
        deleteFile: vi.fn(),
        ensureSignedIn: vi.fn(),
    }
}));



const TEST_STYLE: DeckStyle = {
    borderColor: '#000000',
    borderWidth: 2,
    backgroundColor: '#ffffff',
    backgroundImage: null,
    globalFont: 'sans-serif',
    gameHp: '',
    gameMana: '',
    gameSuit: '',
    svgFrameColor: '#000000',
    svgCornerColor: '#000000',
    svgStrokeWidth: 2,
    elements: [],
};

function makeTemplate(overrides: Partial<DeckTemplate> = {}): DeckTemplate {
    return {
        id: 'test-id',
        version: 1,
        name: 'Test Template',
        isOfficial: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        style: { ...TEST_STYLE },
        ...overrides,
    };
}

describe('templateStorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('createFromStyle', () => {
        it('creates a DeckTemplate from a DeckStyle', () => {
            const template = templateStorageService.createFromStyle('My Template', TEST_STYLE, 'front');

            expect(template.name).toBe('My Template');
            expect(template.version).toBe(1);
            expect(template.isOfficial).toBe(false);
            expect(template.side).toBe('front');
            expect(template.style.borderColor).toBe('#000000');
            expect(template.id).toBeDefined();
            expect(template.createdAt).toBeDefined();
        });

        it('deep-clones the style', () => {
            const style = { ...TEST_STYLE, elements: [{ id: '1', type: 'text' as const, name: 'T', x: 0, y: 0, width: 100, height: 30, rotate: 0, scale: 1, zIndex: 10, opacity: 1, side: 'front' as const }] };
            const template = templateStorageService.createFromStyle('Clone Test', style);

            // Mutating the original should not affect the template
            style.elements[0].x = 999;
            expect(template.style.elements[0].x).toBe(0);
        });
    });

    describe('localStorage operations', () => {
        it('saveToLocal stores a template', () => {
            const template = makeTemplate();
            templateStorageService.saveToLocal(template);

            const stored = JSON.parse(localStorage.getItem('cardcraft_user_templates')!);
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('Test Template');
        });

        it('saveToLocal upserts by id', () => {
            const t1 = makeTemplate({ id: 'u1', name: 'First' });
            const t2 = makeTemplate({ id: 'u1', name: 'Updated' });

            templateStorageService.saveToLocal(t1);
            templateStorageService.saveToLocal(t2);

            const stored = JSON.parse(localStorage.getItem('cardcraft_user_templates')!);
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('Updated');
        });

        it('listCustomTemplates returns from localStorage when not signed in', async () => {
            const template = makeTemplate();
            templateStorageService.saveToLocal(template);

            const templates = await templateStorageService.listCustomTemplates();
            expect(templates).toHaveLength(1);
            expect(templates[0].name).toBe('Test Template');
        });

        it('delete removes from localStorage', async () => {
            templateStorageService.saveToLocal(makeTemplate({ id: 'a' }));
            templateStorageService.saveToLocal(makeTemplate({ id: 'b' }));

            await templateStorageService.delete('a');

            const stored = JSON.parse(localStorage.getItem('cardcraft_user_templates')!);
            expect(stored).toHaveLength(1);
            expect(stored[0].id).toBe('b');
        });

        it('skips invalid templates from localStorage', async () => {
            localStorage.setItem('cardcraft_user_templates', JSON.stringify([
                makeTemplate({ id: 'valid' }),
                { id: 'bad', broken: true }, // Invalid: missing required fields
            ]));

            const templates = await templateStorageService.listCustomTemplates();
            expect(templates).toHaveLength(1);
            expect(templates[0].id).toBe('valid');
        });
    });

    describe('importFromFile', () => {
        // Helper: jsdom File doesn't always support .text(), so create a File-like object from Blob
        function makeFile(content: string, name: string): File {
            const blob = new Blob([content], { type: 'application/json' });
            return new File([blob], name, { type: 'application/json' });
        }

        it('parses a valid .style.json file', async () => {
            const template = makeTemplate({ name: 'Imported' });
            const file = makeFile(JSON.stringify(template), 'test.style.json');

            const result = await templateStorageService.importFromFile(file);
            expect(result).not.toBeNull();
            expect(result!.name).toBe('Imported');
        });

        it('returns null for invalid JSON', async () => {
            const file = makeFile('not json', 'bad.style.json');
            const result = await templateStorageService.importFromFile(file);
            expect(result).toBeNull();
        });

        it('returns null for valid JSON but invalid schema', async () => {
            const file = makeFile(JSON.stringify({ id: 'partial' }), 'partial.style.json');
            const result = await templateStorageService.importFromFile(file);
            expect(result).toBeNull();
        });
    });
});
