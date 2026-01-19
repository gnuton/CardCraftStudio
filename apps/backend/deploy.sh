#!/bin/bash

# CardCraft Backend - Cloud Run Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: dev, staging, prod

set -e

# Configuration
ENVIRONMENT=${1:-dev}
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION="us-central1"
SERVICE_NAME="cardcraft-backend-${ENVIRONMENT}"
REGISTRY="us-central1-docker.pkg.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CardCraft Backend Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: GCP_PROJECT_ID environment variable not set${NC}"
    echo "Set it with: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI not found${NC}"
    echo "Install it from: https://cloud.google.com/sdk"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker not found${NC}"
    echo "Install it from: https://www.docker.com/get-started"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${REGISTRY}/${PROJECT_ID}/cardcraft/backend:${ENVIRONMENT} .

echo -e "${YELLOW}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGISTRY} --quiet

echo -e "${YELLOW}⬆️  Pushing image to Artifact Registry...${NC}"
docker push ${REGISTRY}/${PROJECT_ID}/cardcraft/backend:${ENVIRONMENT}

echo -e "${YELLOW}☁️  Deploying to Cloud Run...${NC}"

# Set environment-specific configurations
if [ "$ENVIRONMENT" = "prod" ]; then
    MIN_INSTANCES=1
    MAX_INSTANCES=20
    MEMORY="512Mi"
else
    MIN_INSTANCES=0
    MAX_INSTANCES=5
    MEMORY="256Mi"
fi

gcloud run deploy ${SERVICE_NAME} \
    --image=${REGISTRY}/${PROJECT_ID}/cardcraft/backend:${ENVIRONMENT} \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --memory=${MEMORY} \
    --cpu=1 \
    --min-instances=${MIN_INSTANCES} \
    --max-instances=${MAX_INSTANCES} \
    --concurrency=80 \
    --timeout=60s \
    --port=8080 \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Testing health endpoint...${NC}"

# Test health endpoint
if curl -f -s "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Cloud Run console"
echo "2. Test the API endpoints"
echo "3. Update frontend VITE_API_BASE_URL to: ${SERVICE_URL}"
