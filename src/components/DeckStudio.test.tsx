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
    DeckPrintLayout: React.forwardRef(({ pages }: any, ref: any) => {
        // Create a simple div that will have the ref attached
        return (
            <div ref={ref} data-testid="print-layout" style={{ position: 'absolute', left: '-9999px' }}>
                {pages.map((_: any, i: number) => (
                    <div key={i} className="print-page" data-testid={`print-page-${i}`}>
                        Page {i}
                    </div>
                ))}
            </div>
        );
    })
}));

describe('DeckStudio PDF Export', () => {
    const mockDeck: CardConfig[] = [
        {
            id: '1',
            title: 'Card 1',
            description: '<p>Desc 1</p>',
            borderColor: '#000',
            borderWidth: 1,
            centerImage: null,
            topLeftContent: 'A',
            bottomRightContent: 'A',
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
                                title: 'Imported Card',
                                description: '<p>Imported</p>',
                                borderColor: '#000',
                                borderWidth: 1,
                                centerImage: 'images/card-1.png',
                                topLeftContent: 'A',
                                bottomRightContent: 'A',
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
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
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
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
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
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
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
            title: 'Card 1',
            description: '<p>Desc 1</p>',
            borderColor: '#000',
            borderWidth: 1,
            centerImage: 'data:image/png;base64,mockdata',
            topLeftContent: 'A',
            bottomRightContent: 'A',
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

    it('has export and import buttons', () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
            />
        );

        expect(screen.getByText(/Export Deck/i)).toBeInTheDocument();
        expect(screen.getByText(/Import Deck/i)).toBeInTheDocument();
    });

    it('exports deck as ZIP with images', async () => {
        render(
            <DeckStudio
                deck={mockDeck}
                projectName="Test Deck"
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
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
                onAddCard={() => { }}
                onEditCard={() => { }}
                onDeleteCard={() => { }}
                onUpdateProjectName={() => { }}
                onUpdateCard={() => { }}
            />
        );

        const exportBtn = screen.getByText(/Export Deck/i);
        expect(exportBtn).toBeDisabled();
    });

    it('imports deck from ZIP file', async () => {
        const mockOnUpdateProjectName = vi.fn();
        const mockOnDeleteCard = vi.fn();
        const mockOnAddCard = vi.fn();
        const mockOnUpdateCard = vi.fn();

        render(
            <DeckStudio
                deck={[]}
                projectName="Test Deck"
                onAddCard={mockOnAddCard}
                onEditCard={() => { }}
                onDeleteCard={mockOnDeleteCard}
                onUpdateProjectName={mockOnUpdateProjectName}
                onUpdateCard={mockOnUpdateCard}
            />
        );

        // Find the hidden file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeInTheDocument();

        // Create a mock file
        const mockFile = new File(['mock zip data'], 'test-deck.zip', { type: 'application/zip' });

        // Trigger file input change
        await act(async () => {
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false
            });
            fireEvent.change(fileInput);
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        // Verify import logic was triggered
        await waitFor(() => {
            expect(mockZipLoadAsync).toHaveBeenCalledWith(mockFile);
        });

        // Verify deck name was updated
        expect(mockOnUpdateProjectName).toHaveBeenCalledWith('Imported Deck');
    });
});
