# Synchronization Strategy & Conflict Resolution

## 1. Core Principle: "Safe & Granular"
The goal is to prevent data loss when multiple devices edit the same Deck. Since real-time CRDTs (Conflict-free Replicated Data Types) are overkill for this stage, we will use a **Last-Write-Wins (LWW) with Conflict Detection** approach.

## 2. Data State
Each Deck has:
*   `updatedAt`: Timestamp of the last local edit.
*   `contentHash`: SHA-256 hash of the JSON content.

## 3. The Sync Logic (Step-by-Step)

When `handleSync()` runs, we iterate through every Deck:

### Step 3.1: Compare Hashes
*   **IF** Local Hash == Remote Hash:
    *   **Action**: Do nothing. They are identical.
    *   **Status**: `Synced`.

### Step 3.2: Compare Timestamps (Hash Mismatch)
*   **IF** Local Hash != Remote Hash:
    *   **Condition A: Remote is NEWER (> 1s difference)**
        *   *Scenario*: User edited on another device recently.
        *   **Action**: **Prompt User (Conflict Dialog)**.
        *   *Options*: "Overwrite Local (Accept changes)" OR "Overwrite Remote (Push my old version? Usually unlikely users want this, but we allow it)".
    *   **Condition B: Local is NEWER (> 1s difference)**
        *   *Scenario*: User just edited this deck offline and is now syncing.
        *   **Action**: **Auto-Push**.
        *   *Rationale*: If my local edit is fresher than the cloud, I likely intend to save my work.
    *   **Condition C: Timestamps are close (< 1s)**
        *   *Scenario*: Race condition.
        *   **Action**: treat as Conflict (Condition A).

## 4. Edge Cases: Offline & "Phantom" Edits
*   **Problem**: User goes offline, edits Deck A. User B (or same user on Device B) edits Deck A. Both have `updatedAt` > `lastSync`.
*   **Resolution**: Since we don't store "Last Sync Time" per deck, we rely on the Remote File's `modifiedTime` from Google Drive metadata.
    *   If `Remote.modifiedTime` > `Local.updatedAt`: **Remote Wins** (Prompt User).
    *   If `Local.updatedAt` > `Remote.modifiedTime`: **Local Wins** (Auto-upload).

## 5. Deletion Rules
*   **Local Deletion**: If a deck is deleted locally, we should check if it exists in the cloud.
    *   *Current Logic*: Local deletion is manual. If user deletes locally, next sync might re-download it if it exists remotely.
    *   *Refinement Needed*: We need a "Tombstone" or "Trash" concept eventually. For now, we assume explicit deletion on one device does NOT auto-delete on Cloud to be safe.

## 6. Image Handling
*   Images inside cards are stored as references (`ref:HASH`).
*   **Rule**: Always upload referenced images *before* uploading the Deck JSON. This ensures referential integrity (no broken images on other devices).

## 7. Recommended Code Changes
To support this strictly, we need to ensure local `updatedAt` is updated accurately on *every* save.
