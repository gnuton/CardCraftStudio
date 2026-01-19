import { describe, it, expect } from 'vitest';
import { templateService } from './templateService';

describe('TemplateService', () => {
    it('parses basic geometry from rect with data-ref', () => {
        const svg = `
            <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
                <rect data-ref="title" x="50" y="50" width="200" height="40" />
            </svg>
        `;
        const layout = templateService.parseSvgContent(svg);
        expect(layout).not.toBeNull();
        const title = layout?.elements['title'];
        expect(title).toBeDefined();
        expect(title?.x).toBe(50);
        expect(title?.y).toBe(50);
        expect(title?.width).toBe(200);
        expect(title?.height).toBe(40);

        // Card Standard Size: 300x420
        // Center: 150, 210

        // OffsetX calculation:
        // center of element = x + w/2 = 50 + 100 = 150
        // offsetX = 150 - 150 = 0
        expect(title?.offsetX).toBe(0);

        // OffsetY calculation:
        // center of element = y + h/2 = 50 + 20 = 70
        // offsetY = 70 - 210 = -140
        expect(title?.offsetY).toBe(-140);
    });

    it('parses transforms (rotate, scale)', () => {
        const svg = `
            <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
                <rect data-ref="test" x="0" y="0" width="10" height="10" transform="rotate(45) scale(2)" />
            </svg>
        `;
        const layout = templateService.parseSvgContent(svg);
        const el = layout?.elements['test'];
        expect(el?.rotation).toBe(45);
        expect(el?.scale).toBe(2);
    });

    it('parses styles from attributes and style string', () => {
        const svg = `
            <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
                <rect data-ref="test" fill="blue" style="font-size:12px;opacity:0.5" />
            </svg>
        `;
        const layout = templateService.parseSvgContent(svg);
        const el = layout?.elements['test'];
        expect(el?.fill).toBe('blue');
        expect(el?.fontSize).toBe(12);
        expect(el?.opacity).toBe(0.5);
    });

    it('generates SVG with updated attributes', async () => {
        const style = {
            borderColor: '#000000',
            borderWidth: 12,
            backgroundColor: '#ffffff',
            globalFont: 'sans-serif',
            svgFrameColor: '#000000',
            svgCornerColor: '#000000',
            svgStrokeWidth: 2,
            elements: [
                {
                    id: 'title',
                    type: 'text',
                    side: 'front',
                    name: 'Title',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 40,
                    rotate: 90,
                    scale: 2,
                    zIndex: 10,
                    opacity: 0.5,
                    fontFamily: 'Arial',
                    fontSize: 16,
                    color: 'blue',
                    textAlign: 'center'
                }
            ]
        };

        const generatedSvg = await templateService.generateSvgWithLayout(null, style as any);

        // We expect the generator to create elements based on style.elements
        expect(generatedSvg).toContain('data-ref="title"');

        // Check transform contains rotation and scale
        expect(generatedSvg).toContain('rotate(90');
        expect(generatedSvg).toContain('scale(2)');

        expect(generatedSvg).toContain('opacity="0.5"');
        expect(generatedSvg).toContain('fill="blue"');
        expect(generatedSvg).toContain('font-family="Arial"');
    });
});
