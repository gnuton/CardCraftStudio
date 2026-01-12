import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeckStudio } from './DeckStudio';
import type { CardConfig } from './CardStudio';

// Mock html-to-image
vi.mock('html-to-image', () => ({
    toJpeg: vi.fn(),
}));

// Mock jsPDF
const mockAddPage = vi.fn();
const mockAddImage = vi.fn();
const mockSave = vi.fn();

vi.mock('jspdf', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            addPage: mockAddPage,
            addImage: mockAddImage,
            save: mockSave,
        })),
    };
});

// Mock dependencies mainly to avoid complexities
vi.mock('./Card', () => ({
    Card: () => <div data-testid="card-preview">Card Content</div>
}));

// Use a simple function component for the mock to avoid hoisting issues with React.forwardRef
vi.mock('./DeckPrintLayout', () => ({
    DeckPrintLayout: ({ pages }: any) => (
        <div>
            {pages.map((_: any, i: number) => (
                <div key={i} className="print-page">Page {i}</div>
            ))}
        </div>
    )
}));

import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import React from 'react';

describe('DeckStudio PDF Export', () => {
    const mockDeck: CardConfig[] = [
        {
            id: '1',
            title: 'Card 1',
            description: 'Desc 1',
            borderColor: '#000',
            borderWidth: 1,
            centerImage: null,
            topLeftContent: 'A',
            bottomRightContent: 'A',
            count: 2
        }
    ];

    it('generates PDF with html-to-image', async () => {
        // Setup mocks
        (toJpeg as any).mockResolvedValue('data:image/jpeg;base64,mockdata');

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

        // Click download
        const btn = screen.getByText(/Download PDF/i);
        fireEvent.click(btn);

        // Wait for generation
        await waitFor(() => {
            expect(toJpeg).toHaveBeenCalled();
            expect(jsPDF).toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalledWith('test-deck.pdf');
        });
    });
});
