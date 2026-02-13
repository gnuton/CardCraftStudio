# Task: Debug and Fix Wireframe Image Generation

## Status
- [x] Investigate why Wireframe Capture is failing (User reports "broken debug view" / "black picture").
- [x] Fix `toPng` capture strategy to ensure valid image generation.
- [x] Verify `capturedWireframe` state in Debug View (Test Capture button added).
- [x] Remove explicit textual "Layout Requirements" from prompt (User request).
- [ ] Ensure AI Model receives valid image data.
- [ ] Validate Backend Prompt construction (System Instructions).

## Context
The user is trying to generate AI backgrounds based on a card wireframe.
Current issues:
1. Captured wireframe image appears to be empty/black or missing in Debug View.
2. AI generates "random stuff", implying it's ignoring the wireframe (likely because the image is bad).
3. Backend errors indicated Gemini sometimes returns text only (refusal), likely due to unclear inputs or safety settings (fixed safety settings, added text fallback).

## Plan
1.  **Frontend Fix**:
    - Modify `AssetGenerate.tsx` to use a more reliable valid layout for the hidden capture element.
    - Instead of `left: 200vw` or `opacity: 0`, place it strictly behind the main content (z-index -1) but within the viewport coordinates to ensure the rendering engine paints it.
    - Add reliable debug feedback in the UI: Show "Capturing..." state and "Capture Size" in debug panel.
    - Ensure `toPng` options allow for capturing elements that might be visually obstructed by other layers (this usually works standardly, but transparency is key).

2.  **Backend Verification**:
    - Improve logging to print the first 100 chars of the base64 string to confirm it's not all black/transparent (e.g. check for varied bytes vs repeated zeros).

3.  **Prompt Engineering**:
    - The prompt refactor in Step 61 was good (adding text coordinates). Ensure this is working.
