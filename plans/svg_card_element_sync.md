# SVG Card Element Synchronization (Completed)

> **Status**: Completed
> **Implemented**: Yes
> **Tests**: Added in `apps/web/src/services/templateService.test.ts`
> **Documentation**: Updated `README.md`

## Requirements

## Requirements

1. **Load SVG Elements**
   - Parse SVG files used as card templates.
   - Extract all graphical elements (paths, rects, circles, text, images, groups, etc.).
   - Preserve each element's **position**, **size**, **rotation**, **scale**, **font size**, **fill**, **stroke**, **stroke‑width**, **background color**, **background image**, and any custom attributes.
- **Reference Mapping**: Each SVG element can have a `data-ref` (or similar) attribute that serves as a stable reference name. This name is displayed in the left‑side description panel of the Style Editor, linking the SVG element to its UI representation.
2. **Map to Internal Card Model**
   - Convert each SVG element into the internal `CardElement` representation used by the style editor.
   - Ensure a 1‑to‑1 mapping of visual attributes so that editing the element in the UI reflects the exact SVG output.
3. **Render in Style Editor Preview**
   - When a user opens the **Style Editor**, the preview must render the SVG‑derived elements with the same visual appearance as the source SVG.
   - Any transformation performed in the editor (move, resize, rotate, scale, style changes) must update the underlying SVG model.
4. **Persist Changes**
   - Exporting the card must generate an SVG that contains the updated attributes, matching the preview.
   - The export routine (`templateService.generateSvgWithLayout`) must incorporate the edited element data.
5. **Edge Cases & Validation**
   - Handle missing or malformed SVG attributes gracefully (fallback defaults).
   - Support nested groups (`<g>`) and preserve hierarchy.
   - Preserve custom data‑attributes used by the app (e.g., `data-id`).
6. **Performance**
   - Parsing and rendering should be fast enough for real‑time editing (≤ 100 ms for typical 300 × 420 px cards).

## Implementation Plan

1. **Audit Existing SVG Handling**
   - Review `templateService.parseSvgContent` and `generateSvgWithLayout` to understand current attribute extraction.
   - Identify missing attribute handling (font size, rotation, scale, background image, etc.).
2. **Extend `ExtractedLayout` Interface**
   - Add fields for `rotation`, `scale`, `fontSize`, `backgroundImage`, and any custom attributes.
3. **Enhance SVG Parsing**
   - In `parseSvgContent`, walk the DOM tree and for each element capture:
     - `transform` attribute → decompose into translate, rotate, scale.
     - `style` / presentation attributes (`fill`, `stroke`, `stroke-width`, `font-size`).
     - `x`, `y`, `width`, `height` for shapes.
   - Store results in the extended `ExtractedLayout`.
4. **Map to Card Model**
   - Create/extend a mapper (`svgToCardElement`) that builds `CardElement` objects from the parsed layout.
   - Ensure each element gets a stable `id` (use existing `data-id` or generate UUID).
5. **Update Style Editor Preview**
   - In the preview component (likely `CardStudio` or similar), replace the static mock data with the mapped `CardElement` list.
   - Bind transformation controls to update the underlying `CardElement` and re‑serialize the SVG on change.
6. **Export Updated SVG**
   - Modify `generateSvgWithLayout` to apply the current `CardElement` state back onto the SVG DOM before serialization.
   - Include all new attributes (rotation, scale, font‑size, background image, etc.).
7. **Add Unit & Integration Tests**
   - **Unit tests** for the parser: given a sample SVG, verify that all attributes are extracted correctly.
   - **Unit tests** for the mapper: ensure a `CardElement` round‑trips to the same SVG representation.
   - **Integration test**: load an SVG, edit an element (e.g., change rotation), export, and compare the exported SVG string to an expected snapshot.
   - Update existing `App.test.tsx` or create new `templateService.test.ts` using Vitest.
8. **Performance Benchmark**
   - Write a quick benchmark test to ensure parsing + rendering stays under the target latency.
9. **Documentation**
   - Add a section to the project README describing the SVG‑to‑card workflow and any new API surface.

## Testing Strategy

| Test Type | Description | Location |
|-----------|-------------|----------|
| **Parser Unit** | Verify that `parseSvgContent` extracts position, size, rotation, scale, font size, fill, stroke, stroke‑width, background color/image from a representative SVG fixture. | `apps/web/src/services/templateService.test.ts` |
| **Mapper Unit** | Ensure `svgToCardElement` creates a `CardElement` that, when fed back to `applyStyle`/`applyTransform`, reproduces the original SVG attributes. | Same file |
| **Preview Integration** | Render the Style Editor with a loaded SVG and assert that the DOM contains elements with the expected CSS transforms and styles. | `apps/web/src/components/StyleEditor.test.tsx` |
| **Export Integration** | Simulate editing an element (e.g., rotate 45°) in the preview, trigger export, and compare the resulting SVG string against a stored snapshot. | `apps/web/src/components/ExportButton.test.tsx` |
| **Performance** | Run the parser on a typical card SVG and assert execution time < 100 ms. | `apps/web/src/services/performance.test.ts` |

---

*All steps are scoped to the `apps/web` codebase. Once the plan is approved, implementation can proceed in incremental PRs.*
