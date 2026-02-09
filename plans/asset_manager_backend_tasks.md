# Backend - Asset Manager Upgrade Tasks

This task list tracks the backend work required to support the new unified Asset Manager.

## 1. Asset Service Enhancements
- [ ] **Task 1.1: SVG Mime-Type Support**
  - **File**: `apps/backend/src/services/assetService.ts`
  - **Description**: Explicitly allow `image/svg+xml` in validation logic if any. Ensure file extension logic handles `.svg` correctly.
  - **Verification**: Write a unit test attempting to create an asset with `image/svg+xml` and asserting it succeeds.

- [ ] **Task 1.2: Image Import Service**
  - **File**: `apps/backend/src/services/assetService.ts`
  - **Description**: Add a method `importFromUrl(url: string, metadata: any)` to `AssetService`.
    - Fetch the image data from the URL (handling potential CORS/fetch errors).
    - Convert to buffer/base64.
    - Call `createAsset` with the data.
  - **Context**: This is needed for the "Search" tab where we get a URL from Google but need to save the actual image to our database.

## 2. API Endpoints
- [ ] **Task 2.1: Import Endpoint**
  - **File**: `apps/backend/src/routes/assets.ts`
  - **Endpoint**: `POST /api/assets/import`
  - **Body**: `{ url: string, source: 'searched' | 'generated', ...metadata }`
  - **Description**: Validation -> Call `assetService.importFromUrl` -> Return created Asset.
  - **Verification**: Test with a public image URL (e.g., placeholder image).

## 3. Cleanup & Optimization
- [ ] **Task 3.1: Verify Indexing**
  - **File**: `firestore.indexes.json` (if needed)
  - **Description**: Ensure queries for `source` (uploaded/generated/searched) combined with `createdAt` sort are supported.

## 4. Testing
- [ ] **Task 4.1: Integration Tests**
  - **File**: `apps/backend/tests/routes/assets.test.ts`
  - **Description**: Add tests for the new `import` endpoint and SVG upload support.
