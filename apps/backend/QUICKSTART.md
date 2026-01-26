# 🚀 Quick Deployment Reference

## Prerequisites Checklist

- [ ] Google Cloud Project created
- [ ] gcloud CLI installed and authenticated
- [ ] Docker installed
- [ ] APIs enabled (Run, Artifact Registry, Custom Search, Vertex AI)
- [ ] Environment variables ready

## One-Command Deploy

```bash
export GCP_PROJECT_ID=your-project-id
cd apps/backend
./deploy.sh dev
```

## Manual Steps

### 1. Build Image
```bash
docker build -t us-central1-docker.pkg.dev/$GCP_PROJECT_ID/cardcraft/backend:latest .
```

### 2. Push to Registry
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
docker push us-central1-docker.pkg.dev/$GCP_PROJECT_ID/cardcraft/backend:latest
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy cardcraft-backend \
  --image=us-central1-docker.pkg.dev/$GCP_PROJECT_ID/cardcraft/backend:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=256Mi \
  --port=8080
```

### 4. Set Environment Variables
```bash
gcloud run services update cardcraft-backend \
  --region=us-central1 \
  --set-env-vars="GOOGLE_API_KEY=xxx,GOOGLE_CUSTOM_SEARCH_CX=xxx,GOOGLE_CLOUD_PROJECT=$GCP_PROJECT_ID,GOOGLE_CLIENT_ID=xxx,GOOGLE_CLIENT_SECRET=xxx,TOKEN_ENCRYPTION_KEY=xxx"
```

## Test Deployment

```bash
SERVICE_URL=$(gcloud run services describe cardcraft-backend --region=us-central1 --format='value(status.url)')
curl $SERVICE_URL/health
```

## Common Commands

### View Logs
```bash
gcloud run services logs read cardcraft-backend --region=us-central1 --limit=50
```

### Update Service
```bash
gcloud run services update cardcraft-backend --region=us-central1 --memory=512Mi
```

### Delete Service
```bash
gcloud run services delete cardcraft-backend --region=us-central1
```

## Cost Estimate

**Free Tier:**
- 2M requests/month
- 360K GB-seconds
- 180K vCPU-seconds

**Typical Usage (256Mi, 1 CPU):**
- ~$0.00002448 per request (beyond free tier)
- First 2M requests: FREE

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | Check logs: `gcloud run services logs read` |
| 403 errors | Verify API keys in environment variables |
| Timeout errors | Increase `--timeout` or optimize code |
| Out of memory | Increase `--memory` to 512Mi |

## CI/CD Status

Check GitHub Actions: `.github/workflows/deploy-backend.yml`

Required secrets:
- `GCP_PROJECT_ID`
- `WIF_PROVIDER`
- `WIF_SERVICE_ACCOUNT`
- `GOOGLE_API_KEY`
- `GOOGLE_CUSTOM_SEARCH_CX`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`
