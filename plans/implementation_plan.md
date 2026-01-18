# Architecture Plan: Robust Deletion Sync

## 1. Problem
Deleting decks offline causes them to reappear ("Zombie Decks") upon next sync, because the sync engine thinks they are new remote files.

## 2. Solution: Deletion Tracking
We will implement a "Pending Deletions" queue using `localStorage` to track IDs of decks deleted while offline (or before sync completes).

### Data Structure
*   **Key**: `cardcraftstudio-deleted-decks`
*   **Value**: `string[]` (Array of Deck IDs)

## 3. Implementation Steps

### Phase 1: Update Logic (App.tsx)
1.  [x] **State**: Add `pendingDeletions` state initialized from localStorage.
2.  [x] **Delete Action**:
    *   When user deletes a deck:
    *   Add ID to `pendingDeletions`.
    *   Persist to `localStorage`.
    *   Remove from UI (`decks` state).
3.  [x] **Sync Logic (`handleSync`)**:
    *   **Step 0 (Pre-Sync Cleanup)**:
        *   Read `pendingDeletions`.
        *   Iterate through IDs.
        *   Call `driveService.deleteFile(fileName)`.
        *   On success, remove ID from `pendingDeletions` and update `localStorage`.
    *   **Step 1 (Normal Sync)**: Proceed as usual. Now the remote file is gone, so it won't be re-downloaded.

### Phase 2: Update Drive Service
1.  [x] Ensure `driveService` has a `deleteFile(name: string)` or `deleteFileById(id: string)` method.
    *   *Note*: Drive API usually deletes by ID. We might need to `listFiles` first to find the ID for the filename `deck-{id}.json`.

### Phase 3: Testing
1.  [x] Add test case: "Offline delete -> Sync -> Remote file deleted -> No Zombie".

## 4. Execution
The Developer will modify `App.tsx` and `googleDrive.ts` immediately.
