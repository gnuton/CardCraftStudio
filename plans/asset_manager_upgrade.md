# Asset Manager Upgrade Plan

## 1. Product Requirements

### 1.1 Overview
The goal is to transform the existing "Asset Manager" into a centralized, powerful hub for all media assets within CardCraft. It will replace disjointed image pickers and serve as the single source of truth for user assets (Raster Images, Vectors/SVGs).

### 1.2 Core Features
- **Unified Asset Library**: A single modal interface to browse, filter, and select assets.
- **Multi-Format Support**: Full support for Raster images (JPG, PNG, WEBP) and **Vector Graphics (SVG)**.
- **Upload Capability**: Drag-and-drop or file picker upload directly within the Asset Manager.
- **Integrated Search**: Search for images via Google Custom Search API and save them directly to the library.
- **AI Generation**: Generate unique assets using Vertex AI (Imagen) and automatically save them to the library.
- **Card Editor Integration**: Seamless integration with the Card Editor. Clicking an image slot opens this Asset Manager.

### 1.3 User Stories
- **As a User**, I want to upload my own SVG logos so I can use crisp vectors on my cards.
- **As a User**, I want to search for "Running Shoes" and immediately add a result to my library for repeated use.
- **As a User**, I want to generate a "Cyberpunk City Background" and have it saved automatically so I don't lose it.
- **As a User**, I want to see all my uploaded, searched, and generated assets in one place, filterable by type.

---

## 2. Architecture & Data Model

### 2.1 Backend (`apps/backend`)
- **Service Layer**:
  - `AssetService`: Enhance to handle SVG mime-types (already supports, just ensure validation allows `image/svg+xml`).
  - **New Endpoint**: `POST /api/assets/import`
    - Accepts `{ imageUrl, source, metadata }`.
    - Fetches the image server-side (avoiding CORS).
    - Stores it via `AssetService.createAsset`.
    - Returns the new `Asset` object.
- **Storage**:
  - Continue using Firestore `assetData` collection (base64 storage) for MVP.
  - Future-proof: Ensure `Asset` model has fields ready for Cloud Storage URLs.

### 2.2 Frontend (`apps/web`)
- **State Management**:
  - Deprecate `ImageService` (IndexedDB) in favor of server-side `AssetService`.
  - Ensure `AssetManager` manages the state of the modal and selected assets.
- **Components**:
  - `AssetManager`: The main container (Modal).
  - `AssetLibrary`: The existing grid view of assets.
  - `AssetUpload`: New tab for drag-and-drop uploads.
  - `AssetSearch`: New tab wrapping Google Search API (migrated from `ImageProviderDialog`).
  - `AssetGenerate`: New tab wrapping Vertex AI (migrated from `ImageProviderDialog`).

---

## 3. Design & UX

### 3.1 Interface Layout
The Asset Manager Modal will feature a **Sidebar Navigation** or **Top Tabs**:
1.  **Library** (Default): Grid of existing assets.
    - Filters: "All", "Generated", "Uploaded", "Searched".
    - Sort: "Newest", "Oldest".
2.  **Upload**:
    - Large drop zone.
    - "Click to Upload" button.
    - Visual feedback for upload progress.
3.  **Search**:
    - Search bar at the top.
    - Grid of results from Google.
    - "Add to Library" button on hover (or auto-add on select).
4.  **Generate**:
    - Prompt input area.
    - Style selector (if applicable).
    - "Generate" button.
    - Result preview -> "Save & Select" button.

### 3.2 Interactions
- **Selection**: Clicking an asset in "Library" selects it and closes the modal (returning the asset to the editor).
- **Importing**: Clicking an image in "Search" or "Generate" automatically imports it to the "Library" and then selects it.
- **Preview**: Hovering over an SVG should show a clean preview.

---

## 4. Implementation Tasks

### 4.1 Backend Tasks (`apps/backend`)
1.  **[API] Create Import Endpoint**: Implement `POST /api/assets/import` to fetch and save external images (handling CORS and buffering).
2.  **[API] Update Asset Validation**: Ensure `AssetService` explicitly allows and handles `image/svg+xml`. Set appropriate flags/metadata for vectors.
3.  **[Service] Refactor Search/Gen**: Update `GoogleSearchService` and `GoogleImagenService` to be called cleanly by the new import flow if needed (or keep them returning URLs/Base64 and let the frontend call `import`).

### 4.2 Frontend Tasks (`apps/web`)
1.  **[UI] Refactor AssetManager**:
    - Split `AssetManager.tsx` into modular tabs (`AssetLibrary`, `AssetUpload`, `AssetSearch`, `AssetGenerate`).
    - Implement the Tab navigation UI.
2.  **[Feat] Implement Upload Tab**:
    - Use `react-dropzone` or native drag-and-drop.
    - Call `assetService.createAsset` with base64 data.
3.  **[Feat] Implement Search Tab**:
    - Port logic from `ImageProviderDialog/SearchTab`.
    - Instead of `imageService.processImage` (IndexedDB), call `assetService.importAsset` (or `createAsset`).
4.  **[Feat] Implement Generate Tab**:
    - Port logic from `ImageProviderDialog/GenerateTab`.
    - Ensure `saveToAssets: true` is sent to the backend.
    - Handle the response to update the Library view immediately.
5.  **[Integration] Update Card Editor**:
    - Replace usage of `ImageProviderDialog` with `AssetManager`.
    - Ensure the `onAssetSelect` callback handles the `Asset` object correctly (extracting the URL).

### 4.3 Migration (Cleanup)
1.  **Deprecate ImageProviderDialog**: usage should be removed.
2.  **Deprecate ImageService**: Local IndexedDB storage should be phased out in favor of Backend Assets.
