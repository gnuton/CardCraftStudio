# Image Provider Dialog - Feature Plan

## Overview

The **Image Provider Dialog** is a unified interface for users to add images to their cards through three methods:
1. **Upload** - Direct file upload from device (FREE tier)
2. **Search** - Search images via Google Custom Search API (PREMIUM tier)
3. **Generate** - AI-generated images via Google Imagen API (PREMIUM tier)

---
## Free Tier Requirements
- Keep backend container at ≤ 0.2 vCPU and 256 MiB memory.
- Limit Cloud Run concurrency and max instances to stay under free vCPU‑seconds.
- Cache and throttle Google Custom Search calls (≤ 100 queries / day).
- Rate‑limit Imagen generation (≤ $0.00 cost during free‑tier testing) and restrict to premium users.
- Use a minimal Docker image (< 300 MiB) and delete old tags.
---
## UI Design

### Dialog Structure
The dialog uses a **tabbed interface** with three panels:

```
┌─────────────────────────────────────────────────────────┐
│  Add Image                                         [X]  │
├─────────────────────────────────────────────────────────┤
│  [ Upload ]    [ 🔍 Search ]    [ ✨ Generate ]         │
│                    ↑ Premium       ↑ Premium            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Tab Content Area]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: Upload (FREE)
- Drag & drop zone with dashed border
- Click to browse file picker
- Supports: JPG, PNG, GIF, WebP (max 5MB)
- Shows recent uploads as quick-select thumbnails
- No backend required - pure client-side

### Tab 2: Search (PREMIUM)
- Search input with debounced API calls
- Grid of 6-12 image results
- Click to select an image
- Pagination / "Load more" button
- Powered by Google Custom Search API (via backend)

### Tab 3: Generate (PREMIUM)
- Text prompt textarea
- Style selector dropdown (Fantasy, Realistic, Cartoon, etc.)
- "Generate Image" button with loading state
- Preview area for generated image
- Powered by Google Imagen API (via backend)

---

## Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐     ┌──────────────────────────────────┐    │
│  │ ImageProviderDialog │────▶│ ImageProviderService (Frontend)  │    │
│  └────────────────────┘     └──────────────────────────────────┘    │
│          │                              │                            │
│          │                              │                            │
│          ▼                              ▼                            │
│  ┌────────────────┐          ┌─────────────────────────┐            │
│  │ imageService   │          │ Backend API Client      │            │
│  │ (IndexedDB)    │          │ /api/images/search      │            │
│  │                │          │ /api/images/generate    │            │
│  └────────────────┘          └─────────────────────────┘            │
│                                         │                            │
└─────────────────────────────────────────│────────────────────────────┘
                                          │ HTTPS
                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js/Express)                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    API Routes                                │    │
│  │  POST /api/images/search   - Proxy to Google Custom Search   │    │
│  │  POST /api/images/generate - Proxy to Google Imagen API      │    │
│  │  GET  /api/user/premium    - Check premium status            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    External Services                         │    │
│  │  - Google Custom Search API (cx key + API key)               │    │
│  │  - Google Imagen API (Vertex AI / PaLM)                      │    │
│  │  - Firebase Auth (for premium validation)                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend Components

| Component | Description |
|-----------|-------------|
| `ImageProviderDialog` | Main dialog container with tab navigation |
| `UploadTab` | Drag/drop zone, file picker, recent images |
| `SearchTab` | Search input, results grid, pagination |
| `GenerateTab` | Prompt input, style selector, preview |
| `PremiumGate` | Wrapper that shows upgrade prompt for locked features |

### Frontend Services

| Service | Description |
|---------|-------------|
| `imageProviderService.ts` | API client for backend calls |
| `imageService.ts` (existing) | Local storage & processing |

### Backend Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/images/search` | POST | Search Google Images | Premium |
| `/api/images/generate` | POST | Generate via Imagen | Premium |
| `/api/user/premium` | GET | Check premium status | Any |

---

## Data Flow

### Upload Flow (FREE)
```
1. User drops/selects file
2. Frontend reads file as DataURL
3. imageService.processImage() → hash → IndexedDB
4. Return ref:hash to parent component
5. Card updates with new image reference
```

### Search Flow (PREMIUM)
```
1. User types search query (debounced 500ms)
2. Frontend calls imageProviderService.searchImages(query)
3. Backend proxies to Google Custom Search API
4. Returns array of { url, thumbnail, title }
5. User clicks image → fetch full image → processImage()
6. Return ref:hash to parent
```

### Generate Flow (PREMIUM)
```
1. User enters prompt + selects style
2. Frontend calls imageProviderService.generateImage(prompt, style)
3. Backend calls Google Imagen API
4. Returns base64 image data
5. processImage() → IndexedDB
6. Return ref:hash to parent
```

---

## Premium Gating Strategy

### Frontend
```typescript
// PremiumGate.tsx
interface PremiumGateProps {
  feature: 'search' | 'generate';
  children: React.ReactNode;
}

// If not premium, show overlay with upgrade CTA
// If premium, render children normally
```

### Backend
```typescript
// middleware/requirePremium.ts
export const requirePremium = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const user = await verifyToken(token);
  
  if (!user?.isPremium) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  
  next();
};
```

---

## API Specifications

### POST /api/images/search
**Request:**
```json
{
  "query": "fantasy dragon card art",
  "page": 1,
  "perPage": 12
}
```

**Response:**
```json
{
  "results": [
    {
      "url": "https://example.com/image.jpg",
      "thumbnail": "https://example.com/image_thumb.jpg",
      "title": "Dragon Fantasy Art",
      "source": "example.com"
    }
  ],
  "totalResults": 142,
  "nextPage": 2
}
```

### POST /api/images/generate
**Request:**
```json
{
  "prompt": "A majestic phoenix rising from flames, card game art style",
  "style": "fantasy",
  "aspectRatio": "3:4"
}
```

**Response:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "prompt": "A majestic phoenix...",
  "generationId": "gen_abc123"
}
```

---

## Implementation Phases

### Phase 1: Foundation (Sprint 1)
- [ ] Create `ImageProviderDialog` component with tab structure
- [ ] Implement `UploadTab` with drag/drop and file picker
- [ ] Integrate with existing `imageService` for local storage
- [ ] Add "Add Image" button trigger points in Card/Style editors

### Phase 2: Backend Setup (Sprint 2)
- [ ] Set up Express.js server in `apps/backend`
- [ ] Configure Google Cloud project with required APIs
- [ ] Implement `/api/images/search` endpoint
- [ ] Implement `/api/images/generate` endpoint
- [ ] Add basic API key authentication

### Phase 3: Search Integration (Sprint 3)
- [ ] Create `SearchTab` component
- [ ] Implement `imageProviderService.searchImages()`
- [ ] Add debounced search input
- [ ] Display results grid with selection
- [ ] Add pagination support

### Phase 4: Generate Integration (Sprint 4)
- [ ] Create `GenerateTab` component
- [ ] Implement `imageProviderService.generateImage()`
- [ ] Add prompt textarea with style selector
- [ ] Implement loading states and preview
- [ ] Handle generation errors gracefully

### Phase 5: Premium Gating (Sprint 5)
- [ ] Implement `PremiumGate` component
- [ ] Add premium status check to backend
- [ ] Integrate with billing/subscription system
- [ ] Add upgrade CTAs and paywall UI
- [ ] Implement backend middleware for premium validation

### Phase 6: Polish & Testing (Sprint 6)
- [ ] Add comprehensive tests
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Accessibility audit
- [ ] Documentation

### Phase 7: CI/CD – Docker Build & Cloud Run Deployment (Sprint 7)
- [ ] Add `Dockerfile` for backend service
- [ ] Create GitHub Action workflow to build Docker image on push to `main`
- [ ] Push image to Google Container Registry (GCR) or Artifact Registry
- [ ] Deploy image to Cloud Run (fully managed) using `gcloud run deploy`
- [ ] Configure Cloud Run service to require authentication for premium endpoints
- [ ] Add secrets (`GCP_PROJECT_ID`, `GCR_REPO`, `CLOUD_RUN_SERVICE`) to GitHub repository
- [ ] Verify deployment via integration tests

---

## Technical Considerations

### Google APIs Required
1. **Custom Search JSON API** - For image search
   - Requires: API Key + Custom Search Engine ID (cx)
   - Pricing: 100 queries/day free, then $5 per 1000 queries
   
2. **Vertex AI Imagen API** - For image generation
   - Requires: GCP project with Vertex AI enabled
   - Pricing: ~$0.02-0.04 per image

### Environment Variables
```env
# Backend
GOOGLE_CLOUD_PROJECT=cardcraft-studio
GOOGLE_API_KEY=AIza...
GOOGLE_CUSTOM_SEARCH_CX=abc123...
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Frontend
VITE_API_BASE_URL=https://api.cardcraftstudio.com
```

### Security Notes
- Never expose API keys in frontend code
- All Google API calls MUST go through backend
- Rate limit API endpoints to prevent abuse
- Validate user authentication before premium features

---

## File Structure

```
apps/
├── web/
│   └── src/
│       ├── components/
│       │   ├── ImageProviderDialog/
│       │   │   ├── ImageProviderDialog.tsx
│       │   │   ├── UploadTab.tsx
│       │   │   ├── SearchTab.tsx
│       │   │   ├── GenerateTab.tsx
│       │   │   ├── PremiumGate.tsx
│       │   │   └── index.ts
│       │   └── ...
│       └── services/
│           ├── imageService.ts (existing)
│           └── imageProviderService.ts (new)
│
└── backend/
    └── src/
        ├── index.ts
        ├── routes/
        │   ├── images.ts
        │   └── user.ts
        ├── middleware/
        │   └── requirePremium.ts
        └── services/
            ├── googleSearch.ts
            └── googleImagen.ts
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Upload success rate | > 99% |
| Search latency (P95) | < 2s |
| Generation latency (P95) | < 20s |
| Premium conversion from gate | > 5% |

---

## Open Questions

1. **Billing System**: Which payment provider for premium? Stripe? Google Play?
2. **Image Caching**: Should we cache search results? For how long?
3. **Generation History**: Should we save past generations for users?
4. **Content Moderation**: Do we need to filter inappropriate content?
5. **Offline Support**: Should generate/search work offline with cached data?

---

*Plan created: 2026-01-18*  
*Last updated: 2026-01-18*
