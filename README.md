# Card Generator

A modern web application for designing and printing custom playing cards with rich text descriptions, image support, and professional PDF export.

![Card Generator](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-5.4-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

## Features

### 🎨 Card Design Studio
- **Rich Text Editor**: Format card descriptions with bold, italic, strikethrough, and lists using TipTap
- **Image Upload**: Add custom images to card centers
- **Title & Description**: Fully customizable card content
- **Live Preview**: See your changes in real-time

### 📚 Deck Management
- **Multi-Card Decks**: Create and manage collections of cards
- **Quantity Control**: Set print quantities for each card individually
- **Grid View**: Visual overview of your entire deck
- **LocalStorage Persistence**: Your work is automatically saved

### 📄 Professional PDF Export
- **Multi-Page Layout**: Automatically generates 3x3 grid layouts (9 cards per A4 page)
- **Cut Lines**: Dashed guides for easy physical cutting
- **High Quality**: SVG-based rendering using `html-to-image` for accurate layouts
- **Batch Export**: Export entire decks with custom quantities in one click

### 💾 Export Options
- **PDF Export**: Multi-page, print-ready PDFs with cut lines
- **SVG Export**: Individual cards as scalable vector graphics

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd velvet-sojourner

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

## Usage

### Creating Your First Card

1. **Start the App**: Run `npm run dev` and open `http://localhost:5173/`
2. **Add a Card**: Click "Add New Card" in the Deck Studio
3. **Design Your Card**:
   - Enter a title
   - Add a description using the rich text editor
   - Upload an image (optional)
4. **Save**: Click "Save to Deck" to add it to your collection

### Generating PDFs

1. **Set Quantities**: In the Deck Studio, use the "Qty" input to set how many copies of each card to print
2. **Download**: Click "Download PDF" to generate a multi-page PDF with all cards
3. **Print**: The PDF includes cut lines for easy physical card creation

### Exporting Individual Cards

1. **Edit a Card**: Click the edit icon on any card in the Deck Studio
2. **Export SVG**: Click "Export SVG" to download the card as a scalable vector graphic

## Project Structure

```
src/
├── components/
│   ├── Card.tsx              # Card display component
│   ├── CardStudio.tsx        # Individual card editor
│   ├── Controls.tsx          # Card editing controls
│   ├── DeckStudio.tsx        # Deck management view
│   ├── DeckPrintLayout.tsx   # PDF print layout
│   └── RichTextEditor.tsx    # TipTap rich text editor
├── utils/
│   └── cn.ts                 # Tailwind class merger
├── App.tsx                   # Main application
└── main.tsx                  # Entry point
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **TipTap** - Rich text editing
- **html-to-image** - SVG/Image generation
- **jsPDF** - PDF creation
- **Lucide React** - Icons
- **Vitest** - Unit testing

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Card Specifications

- **Dimensions**: Poker-sized cards (2.5" × 3.5" / 63.5mm × 88.9mm)
- **Layout**: 3×3 grid per A4 page
- **Border**: 1px black border (standardized)
- **Format**: A4 (210mm × 297mm)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

The project includes comprehensive unit tests for critical functionality:

- ✅ Card rendering
- ✅ Deck management
- ✅ PDF generation with mocked dependencies
- ✅ User interactions

Run `npm test` to execute the test suite.

## License

MIT

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Rich text editing powered by [TipTap](https://tiptap.dev/)
