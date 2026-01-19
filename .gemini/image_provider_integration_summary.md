# Image Provider Dialog Integration - Summary

## Issue Fixed
The ImageProviderDialog was not showing when an image card element was clicked in the card view.

## Root Cause
The `CardStudio` component was not configured to:
1. Detect when an image element was selected
2. Open the `ImageProviderDialog` when an image element is clicked
3. Handle the image selection from the dialog and update the card config

## Solution Implemented

### 1. Added ImageProviderDialog to CardStudio
**File**: `apps/web/src/components/CardStudio.tsx`

- Imported `ImageProviderDialog` component
- Added state to track dialog open/close: `isImageDialogOpen`
- Created `handleElementSelect` function that:
  - Sets the selected element
  - Checks if the selected element is an image type
  - Opens the dialog if it's an image element
- Created `handleImageProviderSelect` function that:
  - Updates the card config with the selected image reference
  - Closes the dialog
- Rendered the `ImageProviderDialog` component at the bottom of CardStudio
- Wired up the dialog's `onClose` and `onImageSelect` handlers

### 2. Updated Card Component Integration
**File**: `apps/web/src/components/Card.tsx`

The Card component already had the necessary click handler for image elements (line 133-138):
```typescript
onClick={(e) => {
    if (isInteractive) {
        e.stopPropagation();
        onSelectElement?.(element.id);
    }
}}
```

This calls `onSelectElement` which is now connected to `handleElementSelect` in CardStudio.

### 3. Added Test Coverage
**File**: `apps/web/src/components/CardStudio.test.tsx`

Created comprehensive tests to verify:
- ✅ ImageProviderDialog opens when an image element is clicked
- ✅ ImageProviderDialog does NOT open when a text element is clicked
- ✅ Card config is updated when an image is selected from the dialog
- ✅ Dialog closes after image selection

All tests are passing.

## How It Works

1. User clicks on an image element in the card view
2. Card component calls `onSelectElement(elementId)`
3. CardStudio's `handleElementSelect` is invoked
4. Function checks if the element type is 'image'
5. If yes, sets `isImageDialogOpen` to true
6. ImageProviderDialog renders with three tabs: Upload, Search, Generate
7. User selects an image from any tab
8. Dialog calls `onImageSelect(imageRef)`
9. CardStudio's `handleImageProviderSelect` updates the card data
10. Dialog closes automatically

## Files Modified
- `apps/web/src/components/CardStudio.tsx` - Added dialog integration
- `apps/web/src/components/CardStudio.test.tsx` - Added test coverage

## Testing
Run tests with:
```bash
cd apps/web
npx vitest src/components/CardStudio.test.tsx
```

All 3 tests pass successfully.
