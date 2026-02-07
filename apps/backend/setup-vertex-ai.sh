#!/bin/bash

# Script to enable Vertex AI API and grant necessary permissions
# Run this with your Google Cloud project authenticated

PROJECT_ID="cardcraft-studio-485208"
SERVICE_ACCOUNT="cardcraft-local-dev@cardcraft-studio-485208.iam.gserviceaccount.com"

echo "🔧 Setting up Vertex AI for CardCraft Studio"
echo "============================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

echo "✅ gcloud CLI is installed and authenticated"
echo ""

# Set the project
echo "📋 Setting active project..."
gcloud config set project $PROJECT_ID

echo ""
echo "🔌 Step 1: Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Vertex AI API enabled"
else
    echo "❌ Failed to enable Vertex AI API"
    exit 1
fi

echo ""
echo "🔐 Step 2: Granting Vertex AI User role to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user"

if [ $? -eq 0 ]; then
    echo "✅ Vertex AI User role granted"
else
    echo "❌ Failed to grant role"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Now you can test AI image generation:"
echo "  cd /home/antonio.aloisio@zalando.de/GITonio/cardcraft/apps/backend"
echo "  node verify-vertex-ai.js"
