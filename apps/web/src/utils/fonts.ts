
export interface FontDef {
    name: string;
    value: string;
    category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
}

export const GOOGLE_FONTS: FontDef[] = [
    // Serif
    { name: 'Merriweather', value: 'Merriweather', category: 'serif' },
    { name: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
    { name: 'Lora', value: 'Lora', category: 'serif' },
    { name: 'PT Serif', value: 'PT Serif', category: 'serif' },
    { name: 'Crimson Text', value: 'Crimson Text', category: 'serif' },
    { name: 'Libre Baskerville', value: 'Libre Baskerville', category: 'serif' },
    { name: 'Cinzel', value: 'Cinzel', category: 'serif' },
    { name: 'EB Garamond', value: 'EB Garamond', category: 'serif' },
    { name: 'Cormorant Garamond', value: 'Cormorant Garamond', category: 'serif' },
    { name: 'Spectral', value: 'Spectral', category: 'serif' },

    // Sans Serif
    { name: 'Roboto', value: 'Roboto', category: 'sans-serif' },
    { name: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
    { name: 'Lato', value: 'Lato', category: 'sans-serif' },
    { name: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
    { name: 'Oswald', value: 'Oswald', category: 'sans-serif' },
    { name: 'Raleway', value: 'Raleway', category: 'sans-serif' },
    { name: 'Poppins', value: 'Poppins', category: 'sans-serif' },
    { name: 'Nunito', value: 'Nunito', category: 'sans-serif' },
    { name: 'Rubik', value: 'Rubik', category: 'sans-serif' },
    { name: 'Work Sans', value: 'Work Sans', category: 'sans-serif' },
    { name: 'Quicksand', value: 'Quicksand', category: 'sans-serif' },
    { name: 'Inter', value: 'Inter', category: 'sans-serif' },

    // Display
    { name: 'Lobster', value: 'Lobster', category: 'display' },
    { name: 'Bebas Neue', value: 'Bebas Neue', category: 'display' },
    { name: 'Abril Fatface', value: 'Abril Fatface', category: 'display' },
    { name: 'Righteous', value: 'Righteous', category: 'display' },
    { name: 'Comfortaa', value: 'Comfortaa', category: 'display' },
    { name: 'Fredoka One', value: 'Fredoka One', category: 'display' },
    { name: 'Patua One', value: 'Patua One', category: 'display' },
    { name: 'Alfa Slab One', value: 'Alfa Slab One', category: 'display' },
    { name: 'Uncial Antiqua', value: 'Uncial Antiqua', category: 'display' },
    { name: 'Rye', value: 'Rye', category: 'display' },
    { name: 'Creepster', value: 'Creepster', category: 'display' },
    { name: 'Bangers', value: 'Bangers', category: 'display' },

    // Handwriting
    { name: 'Dancing Script', value: 'Dancing Script', category: 'handwriting' },
    { name: 'Pacifico', value: 'Pacifico', category: 'handwriting' },
    { name: 'Shadows Into Light', value: 'Shadows Into Light', category: 'handwriting' },
    { name: 'Indie Flower', value: 'Indie Flower', category: 'handwriting' },
    { name: 'Amatic SC', value: 'Amatic SC', category: 'handwriting' },
    { name: 'Caveat', value: 'Caveat', category: 'handwriting' },
    { name: 'Satisfy', value: 'Satisfy', category: 'handwriting' },
    { name: 'Great Vibes', value: 'Great Vibes', category: 'handwriting' },
    { name: 'Permanent Marker', value: 'Permanent Marker', category: 'handwriting' },
    { name: 'Sacramento', value: 'Sacramento', category: 'handwriting' },

    // Monospace
    { name: 'Roboto Mono', value: 'Roboto Mono', category: 'monospace' },
    { name: 'Source Code Pro', value: 'Source Code Pro', category: 'monospace' },
    { name: 'Space Mono', value: 'Space Mono', category: 'monospace' },
    { name: 'Fira Code', value: 'Fira Code', category: 'monospace' },
    { name: 'Inconsolata', value: 'Inconsolata', category: 'monospace' },
    { name: 'VT323', value: 'VT323', category: 'monospace' }
];

// Helper to construct Google Fonts URL
export const getGoogleFontUrl = (fonts: string[]) => {
    if (!fonts || fonts.length === 0) return null;

    const genericFonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit / default'];

    // Sort and deduplicate
    const uniqueFonts = Array.from(new Set(fonts.filter(f => f && !genericFonts.includes(f.toLowerCase()))));
    if (uniqueFonts.length === 0) return null;

    const query = uniqueFonts
        .map(font => font.replace(/\s+/g, '+'))
        .join('&family=');

    return `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
};
