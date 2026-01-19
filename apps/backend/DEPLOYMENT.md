# Cloud Run Deployment Guide

This guide covers deploying the CardCraft backend to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project**
   - Create a project at [console.cloud.google.com](https://console.cloud.google.com)
   - Note your Project ID

2. **Enable Required APIs**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com \
     customsearch.googleapis.com \
     aiplatform.googleapis.com
   ```

3. **Install gcloud CLI**
   - Download from [cloud.google.com/sdk](https://cloud.google.com/sdk)
   - Authenticate: `gcloud auth login`
   - Set project: `gcloud config set project YOUR_PROJECT_ID`

## Local Docker Build & Test

```bash
cd apps/backend

# Build the image
docker build -t cardcraft-backend .

# Test locally
docker run -p 8080:8080 \
  -e GOOGLE_API_KEY=your_key \
  -e GOOGLE_CUSTOM_SEARCH_CX=your_cx \
  -e GOOGLE_CLOUD_PROJECT=your_project \
  cardcraft-backend

# Test health endpoint
curl http://localhost:8080/health
```

## Manual Deployment

### 1. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create cardcraft \
  --repository-format=docker \
  --location=us-central1 \
  --description="CardCraft Docker images"
```

### 2. Build and Push Image

```bash
# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and tag
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cardcraft/backend:latest .

# Push to registry
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cardcraft/backend:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy cardcraft-backend \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cardcraft/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=YOUR_KEY,GOOGLE_CUSTOM_SEARCH_CX=YOUR_CX,GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60s \
  --port=8080
```

### 4. Get Service URL

```bash
gcloud run services describe cardcraft-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

## CI/CD with GitHub Actions

### Setup Workload Identity Federation (Recommended)

This is more secure than using service account keys.

1. **Create Service Account**
   ```bash
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions"
   ```

2. **Grant Permissions**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.writer"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Create Workload Identity Pool**
   ```bash
   gcloud iam workload-identity-pools create github \
     --location=global \
     --display-name="GitHub Actions Pool"
   
   gcloud iam workload-identity-pools providers create-oidc github-provider \
     --location=global \
     --workload-identity-pool=github \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

4. **Bind Service Account**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/YOUR_GITHUB_USERNAME/cardcraft"
   ```

5. **Add GitHub Secrets**
   
   Go to your GitHub repo → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID
   - `WIF_PROVIDER`: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider`
   - `WIF_SERVICE_ACCOUNT`: `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`
   - `GOOGLE_API_KEY`: Your Google API Key
   - `GOOGLE_CUSTOM_SEARCH_CX`: Your Custom Search Engine ID

### Trigger Deployment

Push to `main` branch or manually trigger the workflow:

```bash
git add .
git commit -m "Deploy backend"
git push origin main
```

Or trigger manually in GitHub Actions tab.

## Environment Variables

Set these in Cloud Run:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Cloud API Key | Yes |
| `GOOGLE_CUSTOM_SEARCH_CX` | Custom Search Engine ID | Yes |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | Yes |
| `PORT` | Server port (auto-set by Cloud Run) | No |

## Cost Optimization

### Free Tier Limits
- 2 million requests/month
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds

### Optimization Tips
1. **Use min-instances=0** for auto-scaling to zero
2. **Set memory=256Mi** (minimum for Node.js)
3. **Set cpu=1** (minimum)
4. **Enable concurrency=80** to handle multiple requests per instance
5. **Set timeout=60s** to prevent long-running requests

### Monitoring Costs

```bash
# View current usage
gcloud run services describe cardcraft-backend \
  --region=us-central1 \
  --format="table(status.url,status.traffic)"

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cardcraft-backend" \
  --limit=50 \
  --format=json
```

## Troubleshooting

### Check Deployment Status
```bash
gcloud run services list --region=us-central1
```

### View Logs
```bash
gcloud run services logs read cardcraft-backend \
  --region=us-central1 \
  --limit=100
```

### Test Endpoints
```bash
# Health check
curl https://YOUR_SERVICE_URL/health

# Search (will fail without valid API key)
curl -X POST https://YOUR_SERVICE_URL/api/images/search \
  -H "Content-Type: application/json" \
  -d '{"query":"dragon"}'
```

### Common Issues

1. **"Service not found"**
   - Check region matches deployment region
   - Verify service name is correct

2. **"Permission denied"**
   - Ensure service account has correct roles
   - Check IAM bindings

3. **"Container failed to start"**
   - Check logs for errors
   - Verify environment variables are set
   - Test Docker image locally first

4. **"Out of memory"**
   - Increase memory limit (e.g., `--memory=512Mi`)
   - Check for memory leaks in application

## Security Best Practices

1. **Use Workload Identity Federation** instead of service account keys
2. **Rotate API keys** regularly
3. **Enable Cloud Armor** for DDoS protection (if needed)
4. **Use Secret Manager** for sensitive values (production)
5. **Implement rate limiting** in application code
6. **Monitor usage** to detect anomalies

## Next Steps

1. Set up custom domain
2. Configure Cloud CDN
3. Add monitoring and alerting
4. Implement Cloud Armor rules
5. Set up staging environment

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
