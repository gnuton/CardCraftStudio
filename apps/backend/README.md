# CardCraft Backend API

Backend service for CardCraft Studio providing image search and AI generation capabilities.

## Features

- **Image Search**: Search for images using Google Custom Search API
- **AI Generation**: Generate custom images using Google Vertex AI Imagen
- **RESTful API**: Clean, tested endpoints with comprehensive error handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Testing**: Vitest with 100% coverage
- **APIs**: Google Custom Search API, Google Vertex AI Imagen

## Setup

### Prerequisites

1. Node.js 18 or higher
2. Google Cloud Project with:
   - Custom Search API enabled
   - Vertex AI API enabled
   - API Key created

### Installation

```bash
cd apps/backend
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_CX=your_custom_search_engine_id
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
TOKEN_ENCRYPTION_KEY=random_32_char_string_for_encryption
JWT_SECRET=random_string_for_jwt_signing
PORT=3001
```

#### Getting Google API Credentials

1. **API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Create API Key

2. **Custom Search Engine ID**:
   - Visit [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Create a new search engine
   - Enable "Image Search"
   - Copy the Search Engine ID (cx parameter)

3. **Google Cloud Project ID**:
   - Find it in your GCP Console dashboard
   - Format: `project-name-123456`

4. **Token Encryption Key**:
   - Generate a random 32-character string
   - Quick command: `openssl rand -hex 16`

5. **JWT Secret**:
   - Generate a random string (any length)
   - Quick command: `openssl rand -hex 32`

## Running

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npx vitest tests/search.test.ts

# Run with coverage
npm run test:coverage
```

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T00:00:00.000Z"
}
```

### Search Images

```
POST /api/images/search
```

**Request:**
```json
{
  "query": "fantasy dragon card art",
  "page": 1
}
```

**Response:**
```json
{
  "results": [
    {
      "url": "https://example.com/image.jpg",
      "thumbnail": "https://example.com/thumb.jpg",
      "title": "Dragon Fantasy Art",
      "contextLink": "https://example.com"
    }
  ]
}
```

### Generate Image

```
POST /api/images/generate
```

**Request:**
```json
{
  "prompt": "A majestic phoenix rising from flames",
  "style": "fantasy"
}
```

**Response:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "prompt": "A majestic phoenix rising from flames"
}
```

**Available Styles:**
- `fantasy`
- `realistic`
- `cartoon`
- `anime`
- `watercolor`
- `oil-painting`

## Project Structure

```
apps/backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Server entry point
│   ├── routes/
│   │   └── images.ts       # Image endpoints
│   └── services/
│       ├── googleSearch.ts # Google Custom Search integration
│       └── googleImagen.ts # Google Imagen AI integration
├── tests/
│   ├── server.test.ts      # Server health tests
│   ├── search.test.ts      # Search endpoint tests
│   ├── generate.test.ts    # Generation endpoint tests
│   └── services/
│       ├── googleSearch.test.ts
│       └── googleImagen.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing required parameters)
- `403`: Forbidden (invalid API credentials)
- `500`: Internal Server Error

## Rate Limiting

**Google Custom Search API:**
- Free tier: 100 queries/day
- Paid: $5 per 1000 queries

**Google Vertex AI Imagen:**
- Pricing: ~$0.02-0.04 per image
- Consider implementing rate limiting for production

## Development

### TDD Workflow

This project follows Test-Driven Development:

1. Write failing test
2. Implement minimal code to pass
3. Refactor
4. Repeat

All features have 100% test coverage.

### Adding New Endpoints

1. Create test file in `tests/`
2. Write endpoint tests
3. Implement route in `src/routes/`
4. Implement service in `src/services/`
5. Register route in `src/app.ts`

## Deployment

### Docker

Build and run locally:

```bash
docker build -t cardcraft-backend .
docker run -p 8080:8080 \
  -e GOOGLE_API_KEY=your_key \
  -e GOOGLE_CUSTOM_SEARCH_CX=your_cx \
  -e GOOGLE_CLOUD_PROJECT=your_project \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GOOGLE_CLIENT_SECRET=your_client_secret \
  -e TOKEN_ENCRYPTION_KEY=your_key \
  -e JWT_SECRET=your_jwt_secret \
  cardcraft-backend
```

### Google Cloud Run

**Quick Deploy:**
```bash
export GCP_PROJECT_ID=your-project-id
./deploy.sh dev
```

**Full Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions including:
- Manual deployment steps
- CI/CD setup with GitHub Actions
- Workload Identity Federation
- Cost optimization
- Troubleshooting

### Environment Configuration

Production deployments should use Google Secret Manager:

```bash
# Create secrets
echo -n "your-api-key" | gcloud secrets create google-api-key --data-file=-
echo -n "your-cx-id" | gcloud secrets create google-search-cx --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding google-api-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## License

MIT
