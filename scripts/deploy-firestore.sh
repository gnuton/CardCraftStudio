#!/bin/bash

# Asset Manager - Firestore Setup Script
# This script deploys Firestore rules and indexes for the Asset Manager feature

set -e  # Exit on error

echo "🚀 Asset Manager - Firestore Setup"
echo "=================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Please install it: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "📋 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase!"
    echo "Please run: firebase login"
    exit 1
fi

echo "✅ Firebase CLI ready"
echo ""

# Deploy Firestore rules
echo "📜 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo ""

# Deploy Firestore indexes
echo "📊 Deploying Firestore composite indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo ""
echo "🎉 Asset Manager Firestore setup complete!"
echo ""
echo "Next steps:"
echo "1. Wait 5-10 minutes for indexes to build"
echo "2. Check index status: firebase firestore:indexes"
echo "3. Test the Asset Manager feature"
echo ""
