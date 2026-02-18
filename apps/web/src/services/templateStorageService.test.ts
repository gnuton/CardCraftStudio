// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templateStorageService } from './templateStorageService';
import { type DeckTemplate, safeParseDeckTemplate } from '../types/template';
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

    describe('serialization safety', () => {
        it('round-trips a complex template through JSON.stringify/parse', () => {
            const complexStyle: DeckStyle = {
                ...TEST_STYLE,
                elements: [
                    {
                        id: 'e1', type: 'text', name: 'Title', side: 'front',
                        x: 10, y: 10, width: 100, height: 20, rotate: 0, scale: 1, zIndex: 1, opacity: 1,
                        fontFamily: 'serif', fontSize: 16, color: '#000'
                    },
                    {
                        id: 'e2', type: 'image', name: 'Icon', side: 'back',
                        x: 50, y: 50, width: 40, height: 40, rotate: 45, scale: 1.5, zIndex: 2, opacity: 0.8,
                        url: 'http://example.com/img.png'
                    }
                ],
                cardSizePreset: 'poker',
                cardWidth: 63,
                cardHeight: 88,
                // Ensure optional fields are handled correctly
                layoutMode: undefined,
            };

            const original = makeTemplate({
                name: 'Complex Serialization Test',
                style: complexStyle,
                description: 'A test template with various data types',
                thumbnailUrl: 'http://example.com/thumb.png',
                // Explicitly set undefined for optional fields to test stripping vs preservation 
                // in JSON (undefined fields are stripped by JSON.stringify)
                author: undefined
            });

            // Simulate storage/network round-trip
            const jsonString = JSON.stringify(original);
            const parsedJson = JSON.parse(jsonString);

            // 1. Verify structural equality
            // Note: JSON.stringify removes keys with undefined values. 
            // So we expect the parsed object to NOT have the keys that were undefined.
            // Vitest's toEqual handles this gracefully usually or strict equality might fail on key presence.
            // Let's verify commonly used fields.
            expect(parsedJson.name).toBe(original.name);
            expect(parsedJson.style.elements).toHaveLength(2);
            expect(parsedJson.style.elements[0].id).toBe('e1');
            expect(parsedJson.thumbnailUrl).toBe('http://example.com/thumb.png');

            // 2. Verify Schema Validation
            const validationResult = safeParseDeckTemplate(parsedJson);
            expect(validationResult).not.toBeNull();

            const validated = validationResult!;
            expect(validated.id).toBe(original.id);
            expect(validated.version).toBe(1);
            expect(validated.style.cardSizePreset).toBe('poker');

            // 3. Verify deep integrity of style
            // We expect the style to match, excluding undefined keys that got stripped
            const recoveredStyle = validated.style;
            expect(recoveredStyle.borderColor).toBe(TEST_STYLE.borderColor);
            expect(recoveredStyle.elements).toHaveLength(2);
        });

        it('rejects templates with missing required fields after parsing', () => {
            const invalidJson = JSON.stringify({
                id: 'bad-id',
                // missing version
                name: 'Bad Template',
                // missing style
            });
            const parsed = JSON.parse(invalidJson);
            const result = safeParseDeckTemplate(parsed);
            expect(result).toBeNull();
        });

        it('handles malicious/extra fields by ignoring or stripping them (Zod default is strip)', () => {
            const original = makeTemplate();
            const withExtra = {
                ...original,
                dangerousField: '<script>alert(1)</script>',
                style: {
                    ...original.style,
                    __proto__: { isAdmin: true }
                }
            };

            const json = JSON.stringify(withExtra);
            const parsed = JSON.parse(json);

            const result = safeParseDeckTemplate(parsed);
            expect(result).not.toBeNull();

            // Zod should strip unknown keys by default unless .passthrough() is used
            // The schema in types/template.ts uses z.object(...) which strips by default!
            expect((result as any).dangerousField).toBeUndefined();
            expect((result!.style as any).__proto__.isAdmin).toBeUndefined();
        });
    });
});
