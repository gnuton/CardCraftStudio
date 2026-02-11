import type { DeckStyle } from '../types/deck';
import { imageService } from './imageService';

// ... (interfaces existing) ...

// ... inside class ...


export interface MarkerLayout {
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    scale: number;
    opacity: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    elementType?: 'text' | 'multiline' | 'image';
}

export interface ExtractedLayout {
    elements: Record<string, MarkerLayout>;
    width?: number;
    height?: number;
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
            const svgEl = doc.documentElement;

            // 1. Determine Card Dimensions from SVG
            // Priority: width/height attributes -> viewBox -> default (300x420 is fallback but we want dynamic)
            let cardWidth = 300;
            let cardHeight = 420;

            const attrWidth = parseFloat(svgEl.getAttribute('width') || '0');
            const attrHeight = parseFloat(svgEl.getAttribute('height') || '0');

            if (attrWidth > 0 && attrHeight > 0) {
                cardWidth = attrWidth;
                cardHeight = attrHeight;
            } else {
                const viewBox = svgEl.getAttribute('viewBox');
                if (viewBox) {
                    const [, , vbW, vbH] = viewBox.split(/[ ,]+/).map(parseFloat);
                    if (vbW > 0 && vbH > 0) {
                        cardWidth = vbW;
                        cardHeight = vbH;
                    }
                }
            }

            const centerX = cardWidth / 2;
            const centerY = cardHeight / 2;

            const elements: Record<string, MarkerLayout> = {};

            // Function to extract properties from an element
            const extractProps = (el: Element): MarkerLayout | undefined => {
                const marker: MarkerLayout = {
                    x: 0, y: 0, width: 0, height: 0,
                    rotation: 0, scale: 1, opacity: 1,
                    offsetX: 0, offsetY: 0
                };

                // Parse Geometry
                if (el.tagName === 'rect' || el.tagName === 'image') {
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
                } else if (el.tagName === 'g' || el.tagName === 'text') {
                    // For groups and text, we might need bounding box, but without rendering it's hard.
                    // We rely on x/y attributes if present, or explicit data attributes potentially.
                    // Fallback to 0 or try to parse 'transform' translate
                    marker.x = parseFloat(el.getAttribute('x') || '0');
                    marker.y = parseFloat(el.getAttribute('y') || '0');
                    // Width/Height are tricky for text/groups without rendering. 
                    // Users should preferably use rects as placeholders/layout guides.
                    // Or we accept data-width/data-height
                    marker.width = parseFloat(el.getAttribute('data-width') || '0');
                    marker.height = parseFloat(el.getAttribute('data-height') || '0');
                }

                // Parse Transforms
                const transform = el.getAttribute('transform');
                if (transform) {
                    // Rotate
                    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                    if (rotateMatch) {
                        const parts = rotateMatch[1].trim().split(/[ ,]+/);
                        marker.rotation = parseFloat(parts[0]) || 0;
                    }

                    // Scale
                    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
                    if (scaleMatch) {
                        const parts = scaleMatch[1].trim().split(/[ ,]+/);
                        marker.scale = parseFloat(parts[0]) || 1;
                    }
                }

                // Parse Style / Attributes
                const style = el.getAttribute('style') || '';
                const styleMap: Record<string, string> = {};
                style.split(';').forEach(rule => {
                    const [key, val] = rule.split(':');
                    if (key && val) styleMap[key.trim()] = val.trim();
                });

                const opacityAttr = el.getAttribute('opacity') || styleMap['opacity'];
                marker.opacity = opacityAttr ? parseFloat(opacityAttr) : 1;

                const fill = el.getAttribute('fill') || styleMap['fill'];
                if (fill) marker.fill = fill;

                const stroke = el.getAttribute('stroke') || styleMap['stroke'];
                if (stroke) marker.stroke = stroke;

                const strokeWidth = el.getAttribute('stroke-width') || styleMap['stroke-width'];
                if (strokeWidth) marker.strokeWidth = parseFloat(strokeWidth);

                const fontSize = el.getAttribute('font-size') || styleMap['font-size'];
                if (fontSize) marker.fontSize = parseFloat(fontSize);

                const fontFamily = el.getAttribute('font-family') || styleMap['font-family'];
                if (fontFamily) marker.fontFamily = fontFamily.replace(/['"]/g, '');

                // NEW: Extract element type from data-type attribute
                const dataType = el.getAttribute('data-type');
                if (dataType && ['text', 'multiline', 'image'].includes(dataType)) {
                    marker.elementType = dataType as 'text' | 'multiline' | 'image';
                }

                // Center Relative Offset Calculation
                // Important: Use the parsed Card Dimensions logic
                marker.offsetX = marker.x + marker.width / 2 - centerX;
                marker.offsetY = marker.y + marker.height / 2 - centerY;

                return marker;
            };

            // Helper: Infer element type from naming conventions (fallback)
            const inferElementType = (ref: string): 'text' | 'multiline' | 'image' => {
                const refLower = ref.toLowerCase();

                // Image patterns
                if (refLower.includes('art') ||
                    refLower.includes('image') ||
                    refLower.includes('illustration') ||
                    refLower.includes('photo') ||
                    refLower.includes('picture')) {
                    return 'image';
                }

                // Multiline text patterns
                if (refLower.includes('description') ||
                    refLower.includes('body') ||
                    refLower.includes('effect') ||
                    refLower.includes('flavor') ||
                    refLower.includes('text')) {
                    return 'multiline';
                }

                // Default to single-line text
                return 'text';
            };

            // Recursively walk or just querySelectorAll
            // querySelectorAll is safer for finding all elements with data-ref
            const refElements = doc.querySelectorAll('[data-ref]');
            refElements.forEach(el => {
                const ref = el.getAttribute('data-ref');
                if (ref) {
                    const props = extractProps(el);
                    if (props) {
                        // Apply convention-based inference if type not explicitly set
                        if (!props.elementType) {
                            props.elementType = inferElementType(ref);
                        }
                        elements[ref] = props;
                    }
                }
            });

            // Fallback: Check ID-based legacy markers if not found via data-ref
            const legacyMap: Record<string, string> = {
                'title': 'layout-title',
                'description': 'layout-description',
                'art': 'layout-center-image',
                'corner': 'layout-top-left',
                'reversedCorner': 'layout-bottom-right'
            };

            Object.entries(legacyMap).forEach(([key, id]) => {
                if (!elements[key]) {
                    const el = doc.getElementById(id);
                    if (el) {
                        const props = extractProps(el);
                        if (props) elements[key] = props;
                    }
                }
            });

            return {
                elements,
                width: cardWidth,
                height: cardHeight
            };


        } catch (error) {
            console.error('Error parsing SVG content:', error);
            return null;
        }
    }

    async generateSvgWithLayout(svgUrl: string | null, style: DeckStyle): Promise<string> {
        let svgDoc: Document;

        const emptySvg = `<svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="420" fill="white"/></svg>`;
        const parser = new DOMParser();

        let resolvedUrl = svgUrl;

        if (svgUrl && svgUrl.startsWith('ref:')) {
            resolvedUrl = await imageService.resolveImage(svgUrl);
        }

        if (resolvedUrl && (resolvedUrl.toLowerCase().endsWith('.svg') || resolvedUrl.startsWith('data:image/svg+xml'))) {
            try {
                const response = await fetch(resolvedUrl);
                const svgText = await response.text();
                svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            } catch (e) {
                console.error("Failed to fetch base SVG, creating empty one", e);
                svgDoc = parser.parseFromString(emptySvg, 'image/svg+xml');
            }
        } else {
            svgDoc = parser.parseFromString(emptySvg, 'image/svg+xml');

            // If we have a background image that isn't an SVG layout, add it as a background image element
            if (resolvedUrl) {
                const bgImage = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
                bgImage.setAttribute('x', '0');
                bgImage.setAttribute('y', '0');
                bgImage.setAttribute('width', '300');
                bgImage.setAttribute('height', '420');
                bgImage.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                bgImage.setAttribute('href', resolvedUrl);

                // Insert as first child to be background
                if (svgDoc.documentElement.firstChild) {
                    svgDoc.documentElement.insertBefore(bgImage, svgDoc.documentElement.firstChild);
                } else {
                    svgDoc.documentElement.appendChild(bgImage);
                }
            }
        }

        const cardWidth = 300;
        const cardHeight = 420;
        const centerX = cardWidth / 2;
        const centerY = cardHeight / 2;

        const updateElement = (refName: string, legacyId: string, props: {
            x?: number; y?: number; width?: number; height?: number;
            rotate?: number; scale?: number; opacity?: number;
            color?: string; fontSize?: number; fontFamily?: string;
            elementType?: string;
        }) => {
            // Find by data-ref first, then ID
            let el = svgDoc.querySelector(`[data-ref="${refName}"]`);
            if (!el && legacyId) el = svgDoc.getElementById(legacyId);

            // If not found, create rectangle if we have geometry? 
            // For now, if it's missing in template, we might skip or create a placeholder.
            // Existing logic created placeholders for rects.
            if (!el) {
                // Only create if we have essential geometry
                if (props.width && props.height) {
                    el = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    if (legacyId) el.setAttribute('id', legacyId);
                    el.setAttribute('data-ref', refName);
                    el.setAttribute('fill', 'transparent');
                    svgDoc.documentElement.appendChild(el);
                } else {
                    return;
                }
            }

            if (el) {
                // Apply Geometry
                // Convert center-relative offsets back to SVG coordinates
                if (props.x !== undefined && props.y !== undefined && props.width !== undefined && props.height !== undefined) {
                    const x = props.x + centerX - props.width / 2;
                    const y = props.y + centerY - props.height / 2;

                    el.setAttribute('x', x.toString());
                    el.setAttribute('y', y.toString());
                    el.setAttribute('width', props.width.toString());
                    el.setAttribute('height', props.height.toString());

                    // Apply Transform (Rotate & Scale)
                    const parts: string[] = [];
                    if (props.rotate && props.rotate !== 0) {
                        parts.push(`rotate(${props.rotate}, ${x + props.width / 2}, ${y + props.height / 2})`);
                    }
                    if (props.scale && props.scale !== 1) {
                        // Scale around center
                        // SVG scale is typically from origin 0,0 unless using translate mess.
                        // Easier: translate to center, scale, translate back.
                        // But for simple single elements, `transform-origin` style is better or `scale(s)` with careful placement.
                        // However, SVG 1.1 `scale(kx,ky)` scales Everything including x,y.
                        // Proper way: translate(cx, cy) scale(s) translate(-cx, -cy)
                        const cx = x + props.width / 2;
                        const cy = y + props.height / 2;
                        parts.push(`translate(${cx}, ${cy}) scale(${props.scale}) translate(${-cx}, ${-cy})`);
                    }

                    if (parts.length > 0) {
                        el.setAttribute('transform', parts.join(' '));
                    } else {
                        el.removeAttribute('transform');
                    }
                }

                // Apply Styles
                if (props.opacity !== undefined) el.setAttribute('opacity', props.opacity.toString());
                if (props.color) el.setAttribute('fill', props.color);
                if (props.fontSize) el.setAttribute('font-size', props.fontSize.toString());
                if (props.fontFamily) el.setAttribute('font-family', props.fontFamily);
                if (props.elementType) el.setAttribute('data-type', props.elementType);
            }
        };

        // Map DeckStyle Elements to SVG
        const legacyMap: Record<string, string> = {
            'title': 'layout-title',
            'description': 'layout-description',
            'art': 'layout-center-image',
            'corner': 'layout-top-left',
            'reversedCorner': 'layout-bottom-right'
        };

        style.elements?.forEach(element => {
            const legacyId = legacyMap[element.id];

            updateElement(element.id, legacyId, {
                x: element.x, y: element.y, width: element.width, height: element.height,
                rotate: element.rotate, scale: element.scale, opacity: element.opacity,
                color: element.color, fontSize: element.fontSize, fontFamily: element.fontFamily,
                elementType: element.type
            });
        });

        // --- Global Styles (Frame/Corner BG colors which are not specific card elements but template parts) ---
        const applyGlobalStyle = (id: string, attrs: Record<string, string | number>) => {
            const el = svgDoc.getElementById(id); // These usually stay as IDs as they are structural
            if (el) {
                Object.entries(attrs).forEach(([key, value]) => {
                    el.setAttribute(key, String(value));
                });
            }
        };

        if (style.svgFrameColor) applyGlobalStyle('frame', { fill: style.svgFrameColor });

        // Corners BGs
        // Assuming these IDs are standard in our templates
        if (style.svgCornerColor) {
            applyGlobalStyle('corner-bg-top-left', { fill: style.svgCornerColor });
            applyGlobalStyle('corner-bg-bottom-right', { fill: style.svgCornerColor });
        }

        if (style.svgStrokeWidth !== undefined) {
            applyGlobalStyle('frame', { 'stroke-width': style.svgStrokeWidth });
            applyGlobalStyle('corner-bg-top-left', { 'stroke-width': style.svgStrokeWidth });
            applyGlobalStyle('corner-bg-bottom-right', { 'stroke-width': style.svgStrokeWidth });
        }

        // Note: Text Content updates (HP, Mana, etc) happen in main app render, 
        // but if we want to bake them into SVG for export:
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
