# Implementation Plan - Fix Wireframe Capture

This plan addresses the issue where the wireframe image sent to the AI is empty/black, causing the AI to generate random results or error out.

## Proposed Changes

### 1. Frontend: `AssetGenerate.tsx`
- **Capture Element Placement**: Move the hidden `WireframePreview` out of the scrollable container and into a fixed position container that sits *behind* the main application background.
    - `z-index: -1`
    - `top: 0, left: 0`
    - `visibility: visible` (crucial for capture)
    - Ensure the main content container has a background color to hide this from the user.
- **Debug View Enhancement**:
    - display the status of `capturedWireframe` explicitly (e.g., "Capture Data: <length> bytes" or "None").
    - Add a "Test Capture" button in Debug mode to manually trigger a capture and show it in a modal/overlay to verify what the browser sees.

### 2. Backend: `googleAiService.ts`
- **Validation**:
    - Add a check for the image data size/composition if possible (simple heuristic).
    - ensure the logic completely falls back to text-only if the image is detected as empty/invalid (though we want to fix the image first).

## Verification Plan
1. **User Action**: Open "Asset Generator".
2. **User Action**: Select "Front Background".
3. **User Action**: Toggle "Show Debug".
4. **User Action**: Click "Generate".
5. **Expected**:
    - Debug view should show a valid "Captured Wireframe" image that looks like white boxes on black background.
    - Backend logs should show "Received layout image. Length: X".
    - Generated image should follow layout.
