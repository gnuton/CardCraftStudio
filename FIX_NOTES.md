# Fix Applied: Wireframe Capture & UI Glitch

## Problem
1. **Black wireframe**: The captured image was black or empty. This was likely due to previously faulty hiding strategies (off-screen clipping or opacity issues) and low contrast (black border on black background).
2. **UI Glitch**: The capture target was overlapping UI content or causing layout shifts.

## Solution
1. **Zero-Height Container**:
   - `AssetGenerate.tsx`: Wrapped the capture target in `<div style={{ height: 0, overflow: 'hidden' }}>`.
   - This keeps the element in the DOM (allowing `html-to-image` to clone and capture it) but completely removes it from the visual document flow, fixing UI glitches.
   
2. **High Contrast Styling**:
   - `AssetGenerate.tsx`: Changed the `minimal` wireframe border from `gray-900` to `white`.
   - This ensures the boundary is clearly visible against the black background in the captured image.

3. **Removed Hacks**:
   - Removed `opacity: 0`, `left: -9999px`, and `toPng` style overrides. The clean container approach renders the element naturally for the cloner.

## Verify
1. UI should be perfectly clean (no black boxes).
2. "Test Capture" should produce a wireframe image with a **white border** and white/gray element boxes on a black background.
