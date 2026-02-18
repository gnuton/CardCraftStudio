// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { DeckStudio } from './DeckStudio';
import type { CardConfig } from './CardStudio';

// Use vi.hoisted to ensure mock functions are available during hoisting
const { mockToJpeg, mockAddPage, mockAddImage, mockSave, mockJsPDF, mockJSZip, mockZipFile, mockZipFolder, mockZipGenerateAsync, mockZipLoadAsync } = vi.hoisted(() => ({
    mockToJpeg: vi.fn(),
    mockAddPage: vi.fn(),
    mockAddImage: vi.fn(),
    mockSave: vi.fn(),
    mockJsPDF: vi.fn(),
    mockJSZip: vi.fn(),
    mockZipFile: vi.fn(),
    mockZipFolder: vi.fn(),
    mockZipGenerateAsync: vi.fn(),
    mockZipLoadAsync: vi.fn(),
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toJpeg: mockToJpeg,
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
    default: mockJsPDF,
}));

// Mock JSZip
vi.mock('jszip', () => ({
    default: mockJSZip,
}));

// Mock Card component
vi.mock('./Card', () => ({
    Card: () => <div data-testid="card-preview">Card Content</div>
}));

// Mock DeckPrintLayout - simpler version without forwardRef complexity
vi.mock('./DeckPrintLayout', () => ({
    DeckPrintLayout: React.forwardRef(({ pages, deckStyle }: any, ref: any) => {
        // Create a simple div that will have the ref attached
        return (
            <div ref={ref} data-testid="print-layout" style={{ position: 'absolute', left: '-9999px' }}>
                <div data-testid="mock-deck-style">{JSON.stringify(deckStyle)}</div>
                {pages.map((_: any, i: number) => (
                    <div key={i} className="print-page" data-testid={`print-page-${i}`}>
                        Page {i}
                    </div>
                ))}
            </div>
        );
    })
}));

const mockDeckStyle = {
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
    // Game Logic
    gameHp: '10',
    gameMana: '10',
    gameSuit: 'hearts',
    // SVG Styling
    svgFrameColor: '#000000',
    svgCornerColor: '#000000',
    svgStrokeWidth: 2,
    elements: []
};

describe('DeckStudio PDF Export', () => {
    const mockDeck: CardConfig[] = [
        {
            id: '1',
            name: 'Card 1',
            data: {
                description: '<p>Desc 1</p>',
                art: '',
                corner: 'A'
            },
            borderColor: '#000',
            borderWidth: 1,
            count: 2
        }
    ];

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Setup jsPDF mock - must be a constructor function
        mockJsPDF.mockImplementation(function (this: any) {
            this.addPage = mockAddPage;
            this.addImage = mockAddImage;
            this.save = mockSave;
            return this;
        });

        // Setup toJpeg mock
        mockToJpeg.mockResolvedValue('data:image/jpeg;base64,mockdata');

        // Setup JSZip mock
        mockZipFile.mockReturnValue(undefined);
        mockZipFolder.mockReturnValue({ file: mockZipFile });
        mockZipGenerateAsync.mockResolvedValue(new Blob(['mock zip data']));
        mockZipLoadAsync.mockResolvedValue({
            file: vi.fn((path: string) => {
                if (path === 'deck.json') {
                    return {
                        async: vi.fn().mockResolvedValue(JSON.stringify({
                            deckName: 'Imported Deck',
                            version: '1.0',
                            cards: [{
                                id: '1',
                                name: 'Imported Card',
                                data: {
                                    description: '<p>Imported</p>',
                                    art: 'images/card-1.png',
                                    corner: 'A'
                                },
                                borderColor: '#000',
                                borderWidth: 1,
                                count: 1
                            }]
                        }))
                    };
                } else if (path === 'images/card-1.png') {
                    return {
                        async: vi.fn().mockResolvedValue(new Blob(['mock image data']))
                    };
                }
                return null;
            })
        });

        mockJSZip.mockImplementation(function (this: any) {
            this.file = mockZipFile;
            this.folder = mockZipFolder;
            this.generateAsync = mockZipGenerateAsync;
            this.loadAsync = mockZipLoadAsync;
            return this;
        });

        // Mock window.alert
        vi.stubGlobal('alert', vi.fn());

        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();

        // Mock FileReader
        global.FileReader = vi.fn().mockImplementation(function (this: any) {
            this.readAsDataURL = vi.fn(function (this: any) {
                this.result = 'data:image/png;base64,mockimagedata';
                if (this.onloadend) this.onloadend();
            });
            return this;
        }) as any;
    });

    it('renders deck studio with cards', () => {
        render(

            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        expect(screen.getByText('Test Deck')).toBeInTheDocument();
        expect(screen.getByText(/2 Cards to Print/i)).toBeInTheDocument();
    });

    it('has download PDF button enabled when deck has cards', () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        const downloadBtn = screen.getByText(/Download PDF/i);
        expect(downloadBtn).toBeInTheDocument();
        expect(downloadBtn).not.toBeDisabled();
    });

    it('generates PDF when button is clicked', async () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        // Verify the print layout exists
        const printLayout = screen.getByTestId('print-layout');
        expect(printLayout).toBeInTheDocument();

        const downloadBtn = screen.getByText(/Download PDF/i);

        // Click the button
        await act(async () => {
            fireEvent.click(downloadBtn);
            // Give it a moment to start processing
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Wait for the PDF generation to complete
        await waitFor(() => {
            expect(mockToJpeg).toHaveBeenCalled();
        }, { timeout: 10000 });

        // Verify the save was called with correct filename
        expect(mockSave).toHaveBeenCalledWith('test-deck.pdf');
    }, 15000);
});

describe('DeckStudio Import/Export', () => {
    const mockDeck: CardConfig[] = [
        {
            id: '1',
            name: 'Card 1',
            data: {
                description: '<p>Desc 1</p>',
                art: 'data:image/png;base64,mockdata',
                corner: 'A',
                reversedCorner: 'A'
            },
            borderColor: '#000',
            borderWidth: 1,
            count: 1
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup JSZip mocks
        mockZipFile.mockReturnValue(undefined);
        mockZipFolder.mockReturnValue({ file: mockZipFile });
        mockZipGenerateAsync.mockResolvedValue(new Blob(['mock zip data']));

        mockJSZip.mockImplementation(function (this: any) {
            this.file = mockZipFile;
            this.folder = mockZipFolder;
            this.generateAsync = mockZipGenerateAsync;
            this.loadAsync = mockZipLoadAsync;
            return this;
        });

        vi.stubGlobal('alert', vi.fn());
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({
            blob: () => Promise.resolve(new Blob(['mock image data']))
        });
    });

    it('has export button', () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        expect(screen.getByText(/Export Deck/i)).toBeInTheDocument();
        expect(screen.queryByText(/Import Deck/i)).not.toBeInTheDocument();
    });

    it('exports deck as ZIP with images', async () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        const exportBtn = screen.getByText(/Export Deck/i);
        fireEvent.click(exportBtn);

        await waitFor(() => {
            expect(mockJSZip).toHaveBeenCalled();
        });

        // Verify ZIP structure
        expect(mockZipFile).toHaveBeenCalledWith('deck.json', expect.any(String));
        expect(mockZipFolder).toHaveBeenCalledWith('images');
        expect(mockZipGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
    });

    it('disables export button when deck is empty', () => {
        render(
            <DeckStudio
                deck={[]}
                projectName="Empty Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        const exportBtn = screen.getByText(/Export Deck/i);
        expect(exportBtn).toBeDisabled();
    });


});

describe('DeckStudio Create Card Placeholder', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup jsPDF mock
        mockJsPDF.mockImplementation(function (this: any) {
            this.addPage = mockAddPage;
            this.addImage = mockAddImage;
            this.save = mockSave;
            return this;
        });

        mockToJpeg.mockResolvedValue('data:image/jpeg;base64,mockdata');

        // Setup JSZip mock
        mockZipFile.mockReturnValue(undefined);
        mockZipFolder.mockReturnValue({ file: mockZipFile });
        mockZipGenerateAsync.mockResolvedValue(new Blob(['mock zip data']));

        mockJSZip.mockImplementation(function (this: any) {
            this.file = mockZipFile;
            this.folder = mockZipFolder;
            this.generateAsync = mockZipGenerateAsync;
            this.loadAsync = mockZipLoadAsync;
            return this;
        });
    });

    it('shows Create New Card placeholder when deck is empty', () => {
        const mockOnAddCard = vi.fn();

        render(
            <DeckStudio
                deck={[]}
                projectName="Empty Deck"
                deckStyle={mockDeckStyle}
                onAddCard={mockOnAddCard}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        expect(screen.getByText('Create New Card')).toBeInTheDocument();
        expect(screen.getByText('Click to add your first card')).toBeInTheDocument();
    });

    it('shows Create New Card placeholder alongside cards when deck has cards', () => {
        const mockDeck: CardConfig[] = [
            {
                id: '1',
                name: 'Test Card',
                data: {
                    description: '<p>Test</p>',
                    art: '',
                    corner: 'A',
                    reversedCorner: 'A'
                },
                borderColor: '#000',
                borderWidth: 1,
                count: 1
            }
        ];

        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        // Should show both the placeholder and the card
        expect(screen.getByText('Create New Card')).toBeInTheDocument();
        expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('calls onAddCard when clicking Create New Card placeholder', () => {
        const mockOnAddCard = vi.fn();

        render(
            <DeckStudio
                deck={[]}
                projectName="Empty Deck"
                deckStyle={mockDeckStyle}
                onAddCard={mockOnAddCard}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        const createCardPlaceholder = screen.getByText('Create New Card').closest('div[class*="cursor-pointer"]');
        expect(createCardPlaceholder).toBeInTheDocument();

        fireEvent.click(createCardPlaceholder!);
        expect(mockOnAddCard).toHaveBeenCalledTimes(1);
    });

    it('does not show Add New Card button in header', () => {
        render(
            <DeckStudio
                deck={[]}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        // The "Add New Card" text button should not exist
        expect(screen.queryByText('Add New Card')).not.toBeInTheDocument();
    });
});

describe('Overlay Actions Visibility', () => {
    const mockDeck: CardConfig[] = [
        {
            id: '1',
            name: 'Card 1',
            data: {
                description: '<p>Desc 1</p>',
                art: '',
                corner: 'A',
                reversedCorner: 'A'
            },
            borderColor: '#000',
            borderWidth: 1,
            count: 1
        }
    ];

    it('renders overlay action buttons for each card with correct stacking context', () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                deckStyle={mockDeckStyle}
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
                onDuplicateCard={() => { }}
                onOpenStyleEditor={() => { }}
            />
        );

        // Check for presence of buttons by title
        expect(screen.getByTitle('Edit Card')).toBeInTheDocument();
        expect(screen.getByTitle('Duplicate Card')).toBeInTheDocument();
        expect(screen.getByTitle('Delete Card')).toBeInTheDocument();

        // We verify the overlay container has z-50 class to ensure visibility over card content
        const editBtn = screen.getByTitle('Edit Card');
        const overlayContainer = editBtn.parentElement;
        expect(overlayContainer).toHaveClass('z-50');
    });
});
