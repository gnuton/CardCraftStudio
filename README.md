# Card Generator

A modern web application for designing and printing custom playing cards with rich text descriptions, image support, and professional PDF export.

![Card Generator](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-5.4-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

### 🚀 [Launch Application](https://gnuton.github.io/CardCraftStudio/)

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
- **Hybrid Storage**: Decks are saved using `localStorage`, while large assets (images) are efficiently managed in **IndexedDB** for high performance and scalability.

### ☁️ Cloud Synchronization & Storage
- **Google Drive Integration**: Sync your entire library across devices using your private Google Drive storage.
- **Bidirectional Sync**: Automatically detects changes in the cloud and keeps your local library up to date.
- **Atomic Image Storage**: Images are stored as separate binary assets (blobs) rather than embedded in JSON, optimizing sync speed and memory usage.
- **Conflict Resolution**: Smart SHA-256 hash-based comparison avoids unnecessary prompts, while genuine conflicts are handled through a clean visual interface.
- **Background Migration**: Seamlessly upgrades legacy decks with embedded Base64 images to the new optimized storage format.

### 🔔 Modern Desktop Experience
- **Toast Notifications**: Non-intrusive, real-time feedback for sync status, uploads, and system events.
- **Responsive Animations**: Fluid transitions and micro-interactions powered by `framer-motion`.
- **Dark Mode**: Fully supports modern dark mode with curated color palettes.

### 📄 Professional PDF Export
- **Multi-Page Layout**: Automatically generates 3x3 grid layouts (9 cards per A4 page)
- **Cut Lines**: Dashed guides for easy physical cutting
- **High Quality**: SVG-based rendering using `html-to-image` for accurate layouts
- **Batch Export**: Export entire decks with custom quantities in one click

### 💾 Export Options
- **PDF Export**: Multi-page, print-ready PDFs with cut lines
- **SVG Export**: Individual cards as scalable vector graphics

### 🖼️ SVG Card Templates
- **Template Synchronization**: Load standard SVG files as card templates. The application automatically detects and maps elements.
- **Visual Sync**: Position, rotation, scale, opacity, fonts, and colors of SVG elements are faithfully rendered in the Card Editor.
- **Bi-directional Editing**: Changes made in the Style Editor (e.g., moving a title or changing a font) are written back to the SVG upon export.
- **Reference Mapping**: Use `data-ref` attributes in your SVGs (e.g., `data-ref="title"`) to explicitly link graphical elements to card properties. These references are displayed in the editor for easy debugging.

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd cardcraftstudio

# Install dependencies for all apps
npm install

# Start development server
# For Frontend only
npm run dev:web

# For Full Stack (Front + Back)
npm run dev
```

The application will be available at `http://localhost:5173/`

### Google Drive Sync Setup

To enable cloud synchronization, you must configure a Google OAuth Client ID:

#### 1. Google Cloud Console
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create a Project** (e.g., "CardCraftStudio").
3.  Go to **APIs & Services** > **Library** and search for **"Google Drive API"**. Click **Enable**.
4.  Go to **APIs & Services** > **OAuth consent screen**:
    *   Select **External**.
    *   Fill in the required App Information (App name, support email, developer email).
    *   Add the scope: `.../auth/drive.file` (View and manage Google Drive files and folders that you have opened or created with this app).
5.  Go to **APIs & Services** > **Credentials**:
    *   Click **Create Credentials** > **OAuth client ID**.
    *   Select **Web application** as the type.
    *   Under **Authorized JavaScript origins**, add:
        *   `https://gnuton.github.io`
        *   `http://localhost:5173` (for local development)
    *   Click **Create** and copy your **Client ID**.

#### 2. Local Development

For local use with full synchronization features, you need to configure both the frontend and backend environment variables.

##### Backend (`apps/backend/.env`)
Create a `.env` file in `apps/backend/` (see `.env.example`):
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/CardCraftStudio/oauth-callback.html
TOKEN_ENCRYPTION_KEY=a-random-32-char-string
```

##### Frontend (`apps/web/.env`)
Create a `.env` file in `apps/web/` (see `.env.example`):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_API_BASE_URL=http://localhost:3001
```

#### 3. GitHub Secrets (for Deployment)
To inject credentials into your production environment:
1.  **Repo Secrets**: In GitHub, go to **Settings** > **Secrets and variables** > **Actions**.
2.  Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3.  The CI/CD pipeline will use these to configure the Cloud Run backend and the static frontend.

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
/
├── apps/
│   ├── web/                  # Frontend Application (@cardcraft/web)
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── services/     # Drive & Image services
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── package.json
│   │
│   └── backend/              # Backend Application (@cardcraft/backend)
│       ├── src/
│       └── package.json
│
├── package.json              # Root workspace config
└── .github/workflows/        # CI/CD pipelines
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Dexie.js** - IndexedDB wrapper for local image storage
- **Framer Motion** - Smooth UI animations
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
- ✅ Google Drive Sync & Conflict Resolution (Bidirectional)
- ✅ User interactions

Run `npm test` to execute the test suite.

## License

Copyright (c) 2026 Antonio 'GNUton' Aloisio

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Rich text editing powered by [TipTap](https://tiptap.dev/)
