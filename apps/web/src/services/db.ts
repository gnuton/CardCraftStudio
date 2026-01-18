import Dexie, { type Table } from 'dexie';

export interface CardImage {
    id: string; // Hash or unique ID
    blob: Blob;
    mimeType: string;
}

export class CardCraftDatabase extends Dexie {
    images!: Table<CardImage>;

    constructor() {
        super('CardCraftStudioDB');
        this.version(1).stores({
            images: 'id' // Primary key
        });
    }
}

export const db = new CardCraftDatabase();
