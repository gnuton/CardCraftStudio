#!/bin/bash

# Configuration
if [ -z "$1" ]; then
    echo "Error: Environment argument is required."
    echo "Usage: ./scripts/read-backend-logs.sh <environment>"
    echo "Example: ./scripts/read-backend-logs.sh dev"
    exit 1
fi

ENVIRONMENT=$1

# Production service is named "cardcraft-backend"
if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
    SERVICE_NAME="cardcraft-backend"
else
    # Development/Staging services follow environment suffix pattern
    SERVICE_NAME="cardcraft-backend-${ENVIRONMENT}"
fi

REGION="us-central1"

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Root directory is one level up from scripts
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Backend env file is in apps/backend/.env
BACKEND_ENV="$ROOT_DIR/apps/backend/.env"

# Load environment variables if backend .env exists
if [ -f "$BACKEND_ENV" ]; then
    # echo "Loading configuration from $BACKEND_ENV"
    export $(cat "$BACKEND_ENV" | grep -v '^#' | xargs)
else
    echo "Warning: $BACKEND_ENV not found. Ensure you have a .env file or set environment variables."
fi

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-${GCP_PROJECT_ID:-""}}

if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID not found. Please set GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID."
    exit 1
fi

echo "Fetching logs for service: ${SERVICE_NAME} in project: ${PROJECT_ID}..."

gcloud run services logs read ${SERVICE_NAME} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --limit=50 \
    --format="value(textPayload)"
