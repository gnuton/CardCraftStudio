import Dexie, { type Table } from 'dexie';

import type { Asset } from '../types/asset';

export interface CardImage {
    id: string; // Hash or unique ID
    blob: Blob;
    mimeType: string;
}

export type LocalAsset = Asset;

export class CardCraftDatabase extends Dexie {
    images!: Table<CardImage>;
    decks!: Table<any>; // Using any to avoid importing Deck type here, or I can import it.
    localAssets!: Table<LocalAsset>;

    constructor() {
        super('CardCraftStudioDB');
        this.version(1).stores({
            images: 'id', // Primary key
            decks: 'id'    // Primary key
        });

        // Add version 2 for localAssets
        this.version(2).stores({
            localAssets: 'id, category, createdAt'
        });
    }
}

export const db = new CardCraftDatabase();
