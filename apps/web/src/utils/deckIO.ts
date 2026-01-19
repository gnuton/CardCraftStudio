
import JSZip from 'jszip';
import type { CardConfig } from '../components/CardStudio';
import type { DeckStyle } from '../App';

interface DeckExportData {
    deckName: string;
    version: string;
    cards: CardConfig[];
    style?: DeckStyle;
}

interface ImportedDeckData {
    name: string;
    cards: CardConfig[];
    style?: DeckStyle;
}

export const exportDeckToZip = async (deck: CardConfig[], deckStyle: DeckStyle, projectName: string) => {
    try {
        const zip = new JSZip();

        // Prepare deck data with image references
        const deckData: DeckExportData = {
            deckName: projectName,
            version: '1.0',
            cards: [],
            style: deckStyle // Include style in export
        };

        // Process each card
        for (let i = 0; i < deck.length; i++) {
            const card = deck[i];
            const cardData = { ...card };

            // If card has an image (art) and it is a data URL, extract it
            // If it is a reference (ref:...), we can't easily export it self-contained without downloading it.
            // For now, we only handle data URLs as per original implementation, 
            // but simplistic support for Refs would be to keep them as refs (broken on other machines) 
            // or try to fetch. Original code used fetch(card.data.art).

            if (card.data.art) {
                // Check if it's a data URL or blob URL we can fetch
                if (card.data.art.startsWith('data:') || card.data.art.startsWith('blob:')) {
                    try {
                        const extension = card.data.art.startsWith('data:image/png') ? 'png' : 'jpg';
                        const imageFileName = `card-${card.id}.${extension}`;

                        const response = await fetch(card.data.art);
                        const blob = await response.blob();

                        zip.folder('images')!.file(imageFileName, blob);
                        cardData.data = { ...cardData.data, art: `images/${imageFileName}` };
                    } catch (e) {
                        console.warn(`Failed to export image for card ${card.id}`, e);
                    }
                }
                // If it's a 'ref:' (Google Drive sync), we leave it as is. 
                // NOTE: This means imported decks on other accounts won't see these images.
                // Ideally we should download and bundle them, but that requires imageService access.
                // For this refactor, we stick to existing behavior (which supported data-urls).
            }

            deckData.cards.push(cardData);
        }

        // Add deck.json to ZIP
        zip.file('deck.json', JSON.stringify(deckData, null, 2));

        // Generate and download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export deck');
    }
};

export const importDeckFromZip = async (file: File): Promise<ImportedDeckData> => {
    try {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);

        // Read deck.json
        const deckJsonFile = zipData.file('deck.json');
        if (!deckJsonFile) {
            throw new Error('Invalid deck file: missing deck.json');
        }

        const deckJsonText = await deckJsonFile.async('text');
        const deckData = JSON.parse(deckJsonText);

        // Restore images
        const restoredCards: CardConfig[] = [];
        if (Array.isArray(deckData.cards)) {
            for (const cardData of deckData.cards) {
                const card = { ...cardData };

                // If card references an image in the zip, restore it
                if (card.data && card.data.art && typeof card.data.art === 'string' && card.data.art.startsWith('images/')) {
                    const imageFile = zipData.file(card.data.art);
                    if (imageFile) {
                        const blob = await imageFile.async('blob');
                        const dataUrl = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        card.data.art = dataUrl;
                    }
                }

                restoredCards.push(card);
            }
        }

        return {
            name: deckData.deckName || 'Imported Deck',
            cards: restoredCards,
            style: deckData.style
        };

    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
};
