# Frontend - Asset Manager Upgrade Tasks

This task list tracks the frontend work required to implement the new unified Asset Manager UI and logic.

## 1. State Management & API Integration
- [ ] **Task 1.1: Update Asset Service**
  - **File**: `apps/web/src/services/assetService.ts`
  - **Description**: Add `importAsset(url: string, ...)` method calling the new backend `POST /api/assets/import`.
  - **Context**: Replaces local IndexedDB logic for search results.

## 2. Component Architecture
- [ ] **Task 2.1: Create Tab Architecture**
  - **File**: `apps/web/src/components/AssetManager/AssetManager.tsx`
  - **Description**: Refactor the main modal to use a Tab system (Library, Upload, Search, Generate).
  - **Action**: Move existing grid logic into `AssetLibrary.tsx`.

- [ ] **Task 2.2: Implement Upload Tab**
  - **File**: `apps/web/src/components/AssetManager/AssetUpload.tsx`
  - **Description**: create a dropzone area. On drop/select, convert file to base64 -> call `assetService.createAsset` -> switch to "Library" tab on success.
  - **Reuse**: Logic from `ImageProviderDialog/UploadTab.tsx`.

- [ ] **Task 2.3: Implement Search Tab**
  - **File**: `apps/web/src/components/AssetManager/AssetSearch.tsx`
  - **Description**: Search input -> Google Search API (via backend proxy or existing service).
  - **Action**: On click result -> call `assetService.importAsset` -> switch to "Library" tab on success.
  - **Reuse**: Logic from `ImageProviderDialog/SearchTab.tsx`.

- [ ] **Task 2.4: Implement Generate Tab**
  - **File**: `apps/web/src/components/AssetManager/AssetGenerate.tsx`
  - **Description**: AI Prompt -> Backend Generate.
  - **Action**: Ensure `saveToAssets: true` is sent. On success, the backend creates the asset. Switch to "Library" tab to show it (or receive it in response and prepend).
  - **Reuse**: Logic from `ImageProviderDialog/GenerateTab.tsx`.

## 3. Integration
- [ ] **Task 3.1: Replace ImageProviderDialog**
  - **File**: `apps/web/src/components/CardEditor/CardEditor.tsx` (or similar)
  - **Description**: identify where `ImageProviderDialog` was opened. Replace with `AssetManager`.
  - **Cleanup**: Remove `ImageProviderDialog` code if no longer used.

## 4. Polish
- [ ] **Task 4.1: SVG Preview Handling**
  - **Description**: Ensure the `AssetGrid` and `AssetCard` components correctly display SVG assets (they should essentially render as images).
- [ ] **Task 4.2: UX Feedback**
  - **Description**: Add loading states for "Importing..." and "Generating..." to prevent UI freezing.
