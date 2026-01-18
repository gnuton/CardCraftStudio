import type { DeckStyle } from '../App';

export interface MarkerLayout {
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
}

export interface ExtractedLayout {
    title?: MarkerLayout;
    description?: MarkerLayout;
    topLeft?: MarkerLayout;
    bottomRight?: MarkerLayout;
    centerImage?: MarkerLayout;
    showCorner: boolean;
    showReversedCorner: boolean;
}

class TemplateService {
    async parseSvgLayout(svgUrl: string): Promise<ExtractedLayout | null> {
        try {
            const response = await fetch(svgUrl);
            if (!response.ok) return null;
            const svgText = await response.text();
            return this.parseSvgContent(svgText);
        } catch (error) {
            console.error('Error parsing SVG layout from URL:', error);
            return null;
        }
    }

    parseSvgContent(svgText: string): ExtractedLayout | null {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');

            const extract = (id: string) => {
                const el = doc.getElementById(id);
                if (!el) return undefined;

                const marker = { x: 0, y: 0, width: 0, height: 0, rotation: 0 };

                // Parse rotation from transform attribute
                const transform = el.getAttribute('transform');
                if (transform) {
                    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                    if (rotateMatch) {
                        const parts = rotateMatch[1].trim().split(/[ ,]+/);
                        marker.rotation = parseFloat(parts[0]) || 0;
                    }
                }

                if (el.tagName === 'rect') {
                    marker.x = parseFloat(el.getAttribute('x') || '0');
                    marker.y = parseFloat(el.getAttribute('y') || '0');
                    marker.width = parseFloat(el.getAttribute('width') || '0');
                    marker.height = parseFloat(el.getAttribute('height') || '0');
                } else if (el.tagName === 'circle') {
                    const cx = parseFloat(el.getAttribute('cx') || '0');
                    const cy = parseFloat(el.getAttribute('cy') || '0');
                    const r = parseFloat(el.getAttribute('r') || '0');
                    marker.x = cx - r;
                    marker.y = cy - r;
                    marker.width = r * 2;
                    marker.height = r * 2;
                } else {
                    return undefined;
                }

                const cardWidth = 300;
                const cardHeight = 420;
                const centerX = cardWidth / 2;
                const centerY = cardHeight / 2;

                return {
                    ...marker,
                    offsetX: marker.x + marker.width / 2 - centerX,
                    offsetY: marker.y + marker.height / 2 - centerY
                };
            };

            const layoutTopLeft = extract('layout-top-left');
            const layoutBottomRight = extract('layout-bottom-right');

            return {
                title: extract('layout-title'),
                description: extract('layout-description'),
                topLeft: layoutTopLeft,
                bottomRight: layoutBottomRight,
                centerImage: extract('layout-center-image'),
                showCorner: !!layoutTopLeft,
                showReversedCorner: !!layoutBottomRight
            };
        } catch (error) {
            console.error('Error parsing SVG content:', error);
            return null;
        }
    }

    async generateSvgWithLayout(svgUrl: string | null, style: DeckStyle): Promise<string> {
        let svgDoc: Document;

        if (svgUrl && svgUrl.toLowerCase().endsWith('.svg')) {
            try {
                const response = await fetch(svgUrl);
                const svgText = await response.text();
                const parser = new DOMParser();
                svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            } catch (e) {
                console.error("Failed to fetch base SVG, creating empty one", e);
                const emptySvg = `<svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="420" fill="white"/></svg>`;
                const parser = new DOMParser();
                svgDoc = parser.parseFromString(emptySvg, 'image/svg+xml');
            }
        } else {
            const emptySvg = `<svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="420" fill="white"/></svg>`;
            const parser = new DOMParser();
            svgDoc = parser.parseFromString(emptySvg, 'image/svg+xml');
        }

        const cardWidth = 300;
        const cardHeight = 420;
        const centerX = cardWidth / 2;
        const centerY = cardHeight / 2;

        const updateMarker = (id: string, offsetX: number, offsetY: number, width: number, height: number, rotation: number) => {
            let el: SVGElement | null = svgDoc.getElementById(id) as SVGElement | null;
            if (!el) {
                const newEl = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                newEl.setAttribute('id', id);
                newEl.setAttribute('fill', 'transparent');
                svgDoc.documentElement.appendChild(newEl);
                el = newEl;
            }

            const x = offsetX + centerX - width / 2;
            const y = offsetY + centerY - height / 2;

            if (el) {
                el.setAttribute('x', x.toString());
                el.setAttribute('y', y.toString());
                el.setAttribute('width', width.toString());
                el.setAttribute('height', height.toString());

                if (rotation !== 0) {
                    el.setAttribute('transform', `rotate(${rotation}, ${x + width / 2}, ${y + height / 2})`);
                } else {
                    el.removeAttribute('transform');
                }
            }
        };

        updateMarker('layout-title', style.titleX, style.titleY, style.titleWidth, 40, style.titleRotate);
        updateMarker('layout-description', style.descriptionX, style.descriptionY, style.descriptionWidth, 100, style.descriptionRotate);
        updateMarker('layout-center-image', style.artX, style.artY, style.artWidth, style.artHeight, 0);

        if (style.showCorner) {
            updateMarker('layout-top-left', style.cornerX, style.cornerY, style.cornerWidth, style.cornerHeight, style.cornerRotate);
        } else {
            const el = svgDoc.getElementById('layout-top-left');
            if (el) el.remove();
        }

        if (style.showReversedCorner) {
            updateMarker('layout-bottom-right', style.reversedCornerX, style.reversedCornerY, style.reversedCornerWidth, style.reversedCornerHeight, style.reversedCornerRotate);
        } else {
            const el = svgDoc.getElementById('layout-bottom-right');
            if (el) el.remove();
        }

        // --- Apply Global/Game Logic Styles ---
        const applyStyle = (id: string, attrs: Record<string, string | number>) => {
            const el = svgDoc.getElementById(id);
            if (el) {
                Object.entries(attrs).forEach(([key, value]) => {
                    el.setAttribute(key, String(value));
                });
            }
        };

        if (style.svgFrameColor) applyStyle('frame', { fill: style.svgFrameColor });
        if (style.svgCornerColor) {
            applyStyle('corner-bg-top-left', { fill: style.svgCornerColor });
            applyStyle('corner-bg-bottom-right', { fill: style.svgCornerColor });
        }
        if (style.svgStrokeWidth !== undefined) {
            applyStyle('frame', { 'stroke-width': style.svgStrokeWidth });
            // Also apply to corners?
            applyStyle('corner-bg-top-left', { 'stroke-width': style.svgStrokeWidth });
            applyStyle('corner-bg-bottom-right', { 'stroke-width': style.svgStrokeWidth });
        }

        // Update Game Logic Text
        const updateText = (id: string, text: string) => {
            const el = svgDoc.getElementById(id);
            if (el) el.textContent = text;
        };

        if (style.gameHp) updateText('text-hp', style.gameHp);
        if (style.gameMana) updateText('text-mana', style.gameMana);
        if (style.gameSuit) updateText('text-suit', style.gameSuit);


        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgDoc);
    }
}

export const templateService = new TemplateService();
