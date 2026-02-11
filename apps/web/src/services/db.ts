import Dexie, { type Table } from 'dexie';

export interface CardImage {
    id: string; // Hash or unique ID
    blob: Blob;
    mimeType: string;
}

export class CardCraftDatabase extends Dexie {
    images!: Table<CardImage>;
    decks!: Table<any>; // Using any to avoid importing Deck type here, or I can import it.

    constructor() {
        super('CardCraftStudioDB');
        this.version(1).stores({
            images: 'id', // Primary key
            decks: 'id'    // Primary key
        });
    }
}

export const db = new CardCraftDatabase();
