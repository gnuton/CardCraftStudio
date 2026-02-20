// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from './templates';
import { safeParseDeckTemplate } from '../types/template';

describe('Built-in Templates', () => {
    it('all templates pass Zod schema validation', () => {
        for (const template of TEMPLATES) {
            const result = safeParseDeckTemplate(template);
            expect(result, `Template "${template.name}" (${template.id}) failed validation`).not.toBeNull();
        }
    });

    it('contains the 6 new card layout templates', () => {
        const newIds = ['blank', 'story_card', 'tcg_standard', 'minimal_icon', 'full_art', 'text_focused'];
        for (const id of newIds) {
            const found = TEMPLATES.find(t => t.id === id);
            expect(found, `Template with id "${id}" not found`).toBeDefined();
        }
    });

    it('all official templates have unique IDs', () => {
        const ids = TEMPLATES.map(t => t.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('all new card layout templates have a category', () => {
        const newIds = ['blank', 'story_card', 'tcg_standard', 'minimal_icon', 'full_art', 'text_focused'];
        for (const id of newIds) {
            const template = TEMPLATES.find(t => t.id === id);
            expect(template?.category, `Template "${id}" should have a category`).toBe('Card Layouts');
        }
    });

    it('all new card layout templates have a description', () => {
        const newIds = ['blank', 'story_card', 'tcg_standard', 'minimal_icon', 'full_art', 'text_focused'];
        for (const id of newIds) {
            const template = TEMPLATES.find(t => t.id === id);
            expect(template?.description, `Template "${id}" should have a description`).toBeDefined();
            expect(template!.description!.length).toBeGreaterThan(10);
        }
    });

    it('new templates have the expected element counts', () => {
        const expectations: Record<string, number> = {
            blank: 0,
            story_card: 4,      // title, art, description, back_title
            tcg_standard: 9,    // title, cost, art, type_label, description, stat_atk, stat_def, footer, back_title
            minimal_icon: 4,    // icon, title, description, back_title
            full_art: 4,        // art, title overlay, subtitle overlay, back_title
            text_focused: 4,    // title, divider, description, back_title
        };

        for (const [id, expectedCount] of Object.entries(expectations)) {
            const template = TEMPLATES.find(t => t.id === id);
            expect(template!.style.elements.length, `Template "${id}" should have ${expectedCount} elements`).toBe(expectedCount);
        }
    });

    it('existing back templates still have their original IDs', () => {
        const existingIds = ['royal_back', 'mystic_back', 'cyber_back'];
        for (const id of existingIds) {
            const found = TEMPLATES.find(t => t.id === id);
            expect(found, `Pre-existing template "${id}" should still exist`).toBeDefined();
        }
    });

    it('back templates are tagged with Back Designs category', () => {
        const backIds = ['royal_back', 'mystic_back', 'cyber_back'];
        for (const id of backIds) {
            const template = TEMPLATES.find(t => t.id === id);
            expect(template?.category).toBe('Back Designs');
        }
    });
});
