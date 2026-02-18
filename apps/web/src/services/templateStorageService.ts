import { driveService } from './googleDrive';
import type { DeckTemplate } from '../types/template';
import { safeParseDeckTemplate } from '../types/template';

const LOCAL_STORAGE_KEY = 'cardcraft_user_templates';
const TEMPLATE_FILE_SUFFIX = '.style.json';

// --- localStorage helpers ---

function loadFromLocalStorage(): DeckTemplate[] {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr
            .map((item: unknown) => safeParseDeckTemplate(item))
            .filter((t): t is DeckTemplate => t !== null);
    } catch {
        console.warn('Failed to read templates from localStorage');
        return [];
    }
}

function saveToLocalStorage(templates: DeckTemplate[]): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
    } catch {
        console.warn('Failed to write templates to localStorage');
    }
}

// --- Public API ---

export const templateStorageService = {
    /**
     * List all custom templates from Drive (preferred) or localStorage fallback.
     */
    async listCustomTemplates(): Promise<DeckTemplate[]> {
        if (driveService.isSignedIn) {
            return this.listFromDrive();
        }
        return loadFromLocalStorage();
    },

    /**
     * Load custom templates stored as .style.json on Google Drive.
     * Each file is validated through the Zod schema; invalid files are skipped.
     */
    async listFromDrive(): Promise<DeckTemplate[]> {
        const files = await driveService.listFiles();
        const jsonFiles = files.filter((f: any) => f.name.endsWith(TEMPLATE_FILE_SUFFIX));

        const templates: DeckTemplate[] = [];
        for (const file of jsonFiles) {
            try {
                const content = await driveService.getFileContent(file.id);
                const json = JSON.parse(content);
                const template = safeParseDeckTemplate(json);
                if (template) {
                    // Track Drive file ID for updates / deletion
                    template.id = file.id;
                    templates.push(template);
                } else {
                    console.warn(`Template '${file.name}' failed validation, skipping.`);
                }
            } catch (e) {
                console.warn(`Failed to parse template '${file.name}':`, e);
            }
        }
        return templates;
    },

    /**
     * Save a DeckTemplate. Writes to Drive if signed in, otherwise to localStorage.
     * Returns the saved template (potentially with an updated `id` from Drive).
     */
    async save(template: DeckTemplate): Promise<DeckTemplate> {
        const templateToSave: DeckTemplate = {
            ...template,
            updatedAt: new Date().toISOString(),
        };

        if (driveService.isSignedIn) {
            return this.saveToDrive(templateToSave);
        }
        return this.saveToLocal(templateToSave);
    },

    /**
     * Save to Google Drive as a `.style.json` blob.
     */
    async saveToDrive(template: DeckTemplate): Promise<DeckTemplate> {
        const fileName = `${template.name.replace(/\s+/g, '_').toLowerCase()}${TEMPLATE_FILE_SUFFIX}`;
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const fileId = await driveService.saveBlob(fileName, blob);
        return { ...template, id: fileId };
    },

    /**
     * Save to localStorage. Upserts by `id`.
     */
    saveToLocal(template: DeckTemplate): DeckTemplate {
        const existing = loadFromLocalStorage();
        const idx = existing.findIndex(t => t.id === template.id);
        if (idx >= 0) {
            existing[idx] = template;
        } else {
            existing.push(template);
        }
        saveToLocalStorage(existing);
        return template;
    },

    /**
     * Delete a template by ID. Removes from Drive if signed in, otherwise from localStorage.
     */
    async delete(templateId: string): Promise<void> {
        if (driveService.isSignedIn) {
            await driveService.deleteFile(templateId);
        } else {
            const existing = loadFromLocalStorage();
            const filtered = existing.filter(t => t.id !== templateId);
            saveToLocalStorage(filtered);
        }
    },

    /**
     * Create a DeckTemplate object from the current style.
     * Does not persist — call `save()` afterwards.
     */
    createFromStyle(
        name: string,
        style: import('../types/deck').DeckStyle,
        side?: 'front' | 'back' | 'both',
    ): DeckTemplate {
        return {
            id: crypto.randomUUID(),
            version: 1,
            name,
            isOfficial: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            style: JSON.parse(JSON.stringify(style)),
            side,
        };
    },

    /**
     * Export a template as a downloadable .style.json file.
     */
    exportToFile(template: DeckTemplate): void {
        const fileName = `${template.name.replace(/\s+/g, '_').toLowerCase()}${TEMPLATE_FILE_SUFFIX}`;
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Import a template from a .style.json File object.
     * Returns the parsed template or null if invalid.
     */
    async importFromFile(file: File): Promise<DeckTemplate | null> {
        try {
            // Use FileReader as fallback for environments where File.text() is unavailable
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            });
            const json = JSON.parse(text);
            return safeParseDeckTemplate(json);
        } catch (e) {
            console.warn('Failed to import template file:', e);
            return null;
        }
    },
};
