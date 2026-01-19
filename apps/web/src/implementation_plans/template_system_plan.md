# Template System Architecture Plan

## Current Status
Currently, the "Templates" in CardCraft are a mix of:
1. **Hardcoded Presets**: Defined in `TEMPLATES` array in `GlobalStyleEditor.tsx`.
2. **SVG-based Custom Templates**: Users can "Save as Template," which generates an SVG containing layout markers and saves it to Google Drive. When loaded, it applies the SVG as a background and attempts to parse layout from it.

## Problem
The current approach has significant limitations:
- **Data Loss**: Saving a template only preserves the background image and basic layout (via SVG markers). It discards critical style information such as:
    - Font choices (Family, size, weight)
    - Specific color palettes (Border color, background color, text colors)
    - Element-specific configurations (that aren't position/size)
- **Confusion**: Users expect "Saving a Template" to snapshot the *entire* look and feel, not just the background.
- **Local vs. Global**: The UI doesn't clearly distinguish between "editing the current deck's one-off style" and "managing reusable templates."

## Proposed Architecture: "Real" Templates

### 1. Data Structure
We will introduce a formal `DeckTemplate` schema that persists the full style configuration.

```typescript
interface DeckTemplate {
  id: string; // UUID or GDrive File ID
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  isOfficial: boolean; // true for built-in hardcoded templates
  
  // The core payload
  style: DeckStyle; 
  
  // Metadata for rendering the list
  thumbnailUrl?: string; // Optional preview image
}
```

### 2. Storage Strategy
- **Google Drive (Primary for Logged-in Users)**:
    - Templates will be saved as JSON files (e.g., `MyTemplate.style.json`) in a dedicated `CardCraft Templates` folder.
    - This allows for full serialization of the `DeckStyle` object.
    - We can also save a companion thumbnail image alongside the JSON for better UI.
- **Local Storage (Fallback/Guest)**:
    - Templates stored in `localStorage` under a `cardcraft_user_templates` key.

### 3. Workflow Changes

#### distinct "Apply" vs "Edit"
- **Applying**: When a user selects a template from the list, we deep-clone its `style` into the current deck's style. 
- **Editing**: The user modifies the current deck's style. This does *not* affect the source template.
- **Saving**:
    - **Save Deck**: Saves the current style as part of the Deck (already exists).
    - **Save as Template**: A new action that takes the *current state* of the style editor and serializes it into a `DeckTemplate` JSON, saving it to the storage provider.

### 4. Migration
- Existing SVG "templates" in Drive should be treated as "Legacy Layouts". 
- We can auto-migrate them by wrapping the SVG url into a new `DeckTemplate` JSON structure with default settings for the missing properties.

## UI Requirements
1. **Template List**:
    - Needs a fixed height with scrollable area (implemented in this task).
    - clear distinction between "Official" and "My Templates".
2. **Editor State**:
    - Clearly label the "Current Style" panel to indicate it is a **Local Instance**.
    - Add a "Design Mode" or "Template Mode" toggle if we want users to edit templates directly (out of scope for now, but good for future).
3. **Saving**:
    - The "Save as Template" dialog needs to capture Name and potentially Description.
    - It should verify if it's overwriting an existing template.

## Implementation Steps
1. **Refactor `GlobalStyleEditor` Layout** (Immediate):
    - Fix the overflowing template list.
    - Add clarification text about "Local Setting".
2. **Service Layer Update** (Future):
    - Update `templateService` and `driveService` to handle `.style.json` read/write.
3. **UI Integration**:
    - Update the "Save" flow to write JSON instead of just generating SVG.
    - Update the "Load" flow to parse JSON and apply the full style.
