import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDeckToZip, importDeckFromZip } from './deckIO';
import type { CardConfig } from '../components/CardStudio';
import type { DeckStyle } from '../App';

// Setup Mocks
const { mockAddPage, mockAddImage, mockSave, mockJsPDF, mockJSZip, mockZipFile, mockZipFolder, mockZipGenerateAsync, mockZipLoadAsync, mockZipFileAsync } = vi.hoisted(() => ({
    mockAddPage: vi.fn(),
    mockAddImage: vi.fn(),
    mockSave: vi.fn(),
    mockJsPDF: vi.fn(),
    mockJSZip: vi.fn(),
    mockZipFile: vi.fn(),
    mockZipFolder: vi.fn(),
    mockZipGenerateAsync: vi.fn(),
    mockZipLoadAsync: vi.fn(),
    mockZipFileAsync: vi.fn(),
}));

// Mock JSZip
vi.mock('jszip', () => ({
    default: mockJSZip,
}));

// Mock dependencies
const mockDeckStyle: DeckStyle = {
    borderColor: '#000000',
    borderWidth: 12,
    backgroundColor: '#ffffff',
    cornerColor: '#000000',
    titleColor: '#000000',
    descriptionColor: '#000000',
    cornerFont: 'serif',
    titleFont: 'sans-serif',
    descriptionFont: 'sans-serif',
    backgroundImage: null,
    cornerContent: 'A',
    titleX: 0,
    titleY: 0,
    titleRotate: 0,
    titleScale: 1,
    titleWidth: 200,
    descriptionX: 0,
    descriptionY: 0,
    descriptionRotate: 0,
    descriptionScale: 1,
    descriptionWidth: 250,
    artX: 0,
    artY: 0,
    artWidth: 264,
    artHeight: 164,
    showTitle: true,
    showDescription: true,
    showArt: true,
    showCorner: true,
    cornerX: -125,
    cornerY: -185,
    cornerRotate: 0,
    cornerWidth: 40,
    cornerHeight: 40,
    gameHp: '10',
    gameMana: '10',
    gameSuit: 'hearts',
    svgFrameColor: '#000000',
    svgCornerColor: '#000000',
    svgStrokeWidth: 2,
    elements: []
};

const mockDeck: CardConfig[] = [
    {
        id: '1',
        name: 'Card 1',
        data: {
            description: '<p>Desc 1</p>',
            art: 'data:image/png;base64,mockdata',
            corner: 'A'
        },
        borderColor: '#000',
        borderWidth: 1,
        count: 1
    }
];

describe('deckIO utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup JSZip structure mocks
        mockZipFile.mockReturnValue({ async: mockZipFileAsync });
        mockZipFolder.mockReturnValue({ file: mockZipFile });
        mockZipGenerateAsync.mockResolvedValue(new Blob(['mock zip data']));

        mockJSZip.mockImplementation(function (this: any) {
            this.file = mockZipFile;
            this.folder = mockZipFolder;
            this.generateAsync = mockZipGenerateAsync;
            this.loadAsync = mockZipLoadAsync;
            // loadAsync returns the zip instance for chaining, but we need to verify its properties
            // In implementation: const zipData = await zip.loadAsync(file); zipData.file(...)
            return this;
        });

        // Setup successful loadAsync return
        mockZipLoadAsync.mockImplementation(function (this: any) {
            return Promise.resolve(this); // Resolves to the 'zip' object itself which has .file()
        });

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            blob: () => Promise.resolve(new Blob(['mock image data']))
        }));

        vi.stubGlobal('URL', {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        });

        vi.stubGlobal('FileReader', class MockFileReader {
            onloadend: any;
            readAsDataURL() {
                this.onloadend && this.onloadend();
            }
            get result() {
                return 'data:image/png;base64,restoreddata';
            }
        });
    });

    describe('exportDeckToZip', () => {
        it('should create a zip file with deck.json and images', async () => {
            const linkSpy = vi.spyOn(document, 'createElement').mockReturnValue({
                click: vi.fn(),
                href: ''
            } as any);

            await exportDeckToZip(mockDeck, mockDeckStyle, 'Test Project');

            expect(mockJSZip).toHaveBeenCalled();
            expect(mockZipFolder).toHaveBeenCalledWith('images');
            // Check that image was added to folder
            expect(mockZipFile).toHaveBeenCalledWith('card-1.png', expect.any(Blob));

            // Check deck.json was created
            expect(mockZipFile).toHaveBeenCalledWith('deck.json', expect.stringContaining('"deckName": "Test Project"'));

            // Check download trigger
            expect(mockZipGenerateAsync).toHaveBeenCalled();
            expect(linkSpy).toHaveBeenCalledWith('a');
        });

        it('should handle errors gracefully', async () => {
            mockZipGenerateAsync.mockRejectedValue(new Error('Zip Error'));
            await expect(exportDeckToZip(mockDeck, mockDeckStyle, 'Test Project')).rejects.toThrow('Failed to export deck');
        });
    });

    describe('importDeckFromZip', () => {
        it('should parse a valid zip file and restore deck data', async () => {
            // Mock file setup
            const mockFile = new File([''], 'deck.zip');

            // Mock deck.json content in zip
            const mockDeckJson = JSON.stringify({
                deckName: 'Imported Deck',
                cards: [{
                    id: '1',
                    data: {
                        art: 'images/card-1.png'
                    }
                }],
                style: mockDeckStyle
            });

            mockZipFileAsync.mockImplementation((type: string) => {
                return mockDeckJson; // For text
            });

            // We need to differentiate .async('text') for deck.json and .async('blob') for images
            // But verify calls first

            const zipInstance = new mockJSZip();
            // Refine mock behavior for specific files
            mockZipFile.mockImplementation((path: string) => {
                if (path === 'deck.json') {
                    return { async: vi.fn().mockResolvedValue(mockDeckJson) };
                }
                if (path === 'images/card-1.png') {
                    return { async: vi.fn().mockResolvedValue(new Blob(['img'])) };
                }
                return null;
            });

            // Update loadAsync to return this configured instance
            mockZipLoadAsync.mockResolvedValue({
                file: mockZipFile
            });

            const result = await importDeckFromZip(mockFile);

            expect(result.name).toBe('Imported Deck');
            expect(result.style).toEqual(mockDeckStyle);
            expect(result.cards).toHaveLength(1);
            expect(result.cards[0].data?.art).toBe('data:image/png;base64,restoreddata');
        });

        it('should throw error if deck.json is missing', async () => {
            const mockFile = new File([''], 'deck.zip');

            mockZipLoadAsync.mockResolvedValue({
                file: vi.fn().mockReturnValue(null) // No deck.json
            });

            await expect(importDeckFromZip(mockFile)).rejects.toThrow('Invalid deck file: missing deck.json');
        });
    });
});
