export interface CardElement {
    id: string;
    type: 'text' | 'multiline' | 'image';
    name: string; // User-facing label

    // Positioning & Transform
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: number;
    scale: number;
    zIndex: number;
    opacity: number;

    // Style Properties
    fontFamily?: string;
    fontSize?: number;
    color?: string; // Text color
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';

    // Specifics
    defaultContent?: string; // Placeholder or default text
    url?: string | null; // For images
    overlayUrl?: string | null; // Optional frame/overlay image (PNG/SVG) to render on top
    isLocked?: boolean; // If true, position is locked (maybe?)
    isVisible?: boolean;

    // Layer
    side: 'front' | 'back';
}

export interface ImageTransform {
    x: number;
    y: number;
    scale: number;
    rotate?: number;
    backgroundColor?: string;
}

export const createDefaultElement = (type: CardElement['type'], side: 'front' | 'back' = 'front'): CardElement => {
    const base = {
        id: crypto.randomUUID(),
        type,
        side,
        x: 0,
        y: 0,
        width: 200,
        height: type === 'multiline' ? 100 : 40,
        rotate: 0,
        scale: 1,
        zIndex: 10,
        opacity: 1,
        isVisible: true,
    };

    switch (type) {
        case 'text':
            return {
                ...base,
                name: 'New Text',
                fontFamily: 'inherit / default',
                fontSize: 16,
                color: '#000000',
                textAlign: 'left',
                defaultContent: 'Text'
            };
        case 'multiline':
            return {
                ...base,
                name: 'New Description',
                fontFamily: 'inherit / default',
                fontSize: 14,
                color: '#000000',
                textAlign: 'left',
                defaultContent: 'Description text...'
            };
        case 'image':
            return {
                ...base,
                name: 'New Image',
                url: null
            };
    }
};
