#!/bin/bash

# Asset Manager - Pre-Deployment Validation Script
# Runs automated checks before deployment

set -e

echo "🔍 Asset Manager - Pre-Deployment Validation"
echo "=============================================="
echo ""

ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Check if required files exist
echo "📁 Checking required files..."
FILES=(
    "apps/backend/src/types/asset.ts"
    "apps/backend/src/services/assetService.ts"
    "apps/backend/src/middleware/requireAuth.ts"
    "apps/backend/src/routes/assets.ts"
    "apps/web/src/types/asset.ts"
    "apps/web/src/services/assetService.ts"
    "apps/web/src/components/AssetCard.tsx"
    "apps/web/src/components/AssetGrid.tsx"
    "apps/web/src/components/AssetManager.tsx"
    "firestore.rules"
    "firestore.indexes.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result 0 "File exists: $file"
    else
        print_result 1 "File missing: $file"
    fi
done

echo ""

# 2. Check TypeScript compilation (backend)
echo "🔨 Checking backend TypeScript compilation..."
cd apps/backend
if npm run build --silent > /dev/null 2>&1; then
    print_result 0 "Backend TypeScript compiles"
else
    print_result 1 "Backend TypeScript compilation failed"
fi
cd ../..

echo ""

# 3. Check TypeScript compilation (frontend)
echo "🔨 Checking frontend TypeScript compilation..."
cd apps/web
if npm run build --silent > /dev/null 2>&1; then
    print_result 0 "Frontend TypeScript compiles"
else
    print_result 1 "Frontend TypeScript compilation failed"
fi
cd ../..

echo ""

# 4. Check for required environment variables
echo "🔐 Checking environment variables..."
if [ -f "apps/backend/.env" ]; then
    print_result 0 ".env file exists"
    
    # Check for critical variables
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS" apps/backend/.env; then
        print_result 0 "GOOGLE_APPLICATION_CREDENTIALS set"
    else
        print_result 1 "GOOGLE_APPLICATION_CREDENTIALS not set"
    fi
else
    print_result 1 ".env file missing"
fi

echo ""

# 5. Check Firestore rules validity
echo "📜 Validating Firestore rules..."
if [ -f "firestore.rules" ]; then
    # Basic syntax check
    if grep -q "rules_version = '2'" firestore.rules && \
       grep -q "service cloud.firestore" firestore.rules && \
       grep -q "match /assets/{assetId}" firestore.rules && \
       grep -q "match /assetData/{storageId}" firestore.rules; then
        print_result 0 "Firestore rules structure valid"
    else
        print_result 1 "Firestore rules structure invalid"
    fi
else
    print_result 1 "firestore.rules file missing"
fi

echo ""

# 6. Check Firestore indexes validity  
echo "📊 Validating Firestore indexes..."
if [ -f "firestore.indexes.json" ]; then
    # Check if it's valid JSON
    if python3 -m json.tool firestore.indexes.json > /dev/null 2>&1; then
        print_result 0 "Firestore indexes JSON valid"
        
        # Check for required indexes
        if grep -q '"userId"' firestore.indexes.json && \
           grep -q '"fileHash"' firestore.indexes.json; then
            print_result 0 "Required indexes present"
        else
            print_result 1 "Required indexes missing"
        fi
    else
        print_result 1 "Firestore indexes JSON invalid"
    fi
else
    print_result 1 "firestore.indexes.json file missing"
fi

echo ""

# 7. Check for common code issues
echo "🔍 Checking for common issues..."

# Check for console.log in production code (warning only)
CONSOLE_LOGS=$(grep -r "console.log" apps/backend/src apps/web/src --exclude-dir=node_modules --exclude-dir=dist --exclude="*.test.ts" --exclude="*.test.tsx" | wc -l)
if [ $CONSOLE_LOGS -gt 10 ]; then
    echo -e "${YELLOW}⚠️  Warning: Found $CONSOLE_LOGS console.log statements${NC}"
else
    print_result 0 "Console.log usage acceptable ($CONSOLE_LOGS found)"
fi

# Check for TODO comments (warning only)
TODOS=$(grep -r "TODO" apps/backend/src apps/web/src --exclude-dir=node_modules --exclude-dir=dist | wc -l)
if [ $TODOS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Found $TODOS TODO comments${NC}"
else
    print_result 0 "No TODO comments found"
fi

echo ""

# 8. Summary
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation checks passed!${NC}"
    echo ""
    echo "✅ Ready for deployment"
    echo ""
    echo "Next steps:"
    echo "1. Review deployment checklist"
    echo "2. Deploy Firestore: ./scripts/deploy-firestore.sh"
    echo "3. Deploy backend: npm run deploy:backend"
    echo "4. Deploy frontend: npm run deploy:frontend"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi
