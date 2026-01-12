import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { DeckStudio } from './DeckStudio';
import type { CardConfig } from './CardStudio';

// Use vi.hoisted to ensure mock functions are available during hoisting
const { mockToJpeg, mockAddPage, mockAddImage, mockSave, mockJsPDF } = vi.hoisted(() => ({
    mockToJpeg: vi.fn(),
    mockAddPage: vi.fn(),
    mockAddImage: vi.fn(),
    mockSave: vi.fn(),
    mockJsPDF: vi.fn(),
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toJpeg: mockToJpeg,
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
    default: mockJsPDF,
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

        // Mock window.alert
        vi.stubGlobal('alert', vi.fn());
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
