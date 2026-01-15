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

            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');

            const extract = (id: string) => {
                const el = doc.getElementById(id);
                if (!el) return undefined;

                let marker = { x: 0, y: 0, width: 0, height: 0, rotation: 0 };

                // Parse rotation from transform attribute
                const transform = el.getAttribute('transform');
                if (transform) {
                    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                    if (rotateMatch) {
                        // rotate(angle) or rotate(angle, cx, cy)
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
            console.error('Error parsing SVG layout:', error);
            return null;
        }
    }
}

export const templateService = new TemplateService();
