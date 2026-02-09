import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { vi, describe, it, expect } from 'vitest';
import type { CardElement } from '../types/element';

// Mock components
vi.mock('./ResolvedImage', () => ({
    ResolvedImage: ({ src }: any) => <img data-testid="resolved-image" src={src} />
}));

describe('Card Removal Logic', () => {
    const mockElement: CardElement = {
        id: 'art',
        type: 'image',
        side: 'front',
        name: 'Art',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotate: 0,
        scale: 1,
        zIndex: 1,
        opacity: 1,
        defaultContent: 'default-image.png'
    };

    it('renders default content when data is undefined', () => {
        render(
            <Card
                element={mockElement}
                data={{}} // undefined for 'art'
                deckStyle={{ elements: [mockElement] } as any}
                isSelected={false}
                isInteractive={true}
                transform={{ x: 0, y: 0, scale: 1 }}
            />
        );
        const img = screen.getByTestId('resolved-image');
        expect(img).toHaveAttribute('src', 'default-image.png');
    });

    it('renders specific content when data is provided', () => {
        render(
            <Card
                element={mockElement}
                data={{ art: 'user-image.png' }}
                deckStyle={{ elements: [mockElement] } as any}
                isSelected={false}
                isInteractive={true}
                transform={{ x: 0, y: 0, scale: 1 }}
            />
        );
        const img = screen.getByTestId('resolved-image');
        expect(img).toHaveAttribute('src', 'user-image.png');
    });

    it('renders empty state when data is empty string (Removal Case)', () => {
        render(
            <Card
                element={mockElement}
                data={{ art: '' }} // Set to empty string
                deckStyle={{ elements: [mockElement] } as any}
                isSelected={false}
                isInteractive={true}
                transform={{ x: 0, y: 0, scale: 1 }}
            />
        );

        // Should NOT render ResolvedImage
        expect(screen.queryByTestId('resolved-image')).not.toBeInTheDocument();

        // Should render "Double-click to add image"
        expect(screen.getByText('Double-click to add image')).toBeInTheDocument();
    });
});
