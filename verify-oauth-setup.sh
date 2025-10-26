#!/bin/bash

# OAuth Configuration Verification Script
# Checks if all required environment variables and settings are correct

echo "🔍 Verifying Google Sheets OAuth Setup..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file found"
    source .env
else
    echo "⚠️  No .env file found locally (this is OK if using Vercel env vars)"
fi

# Check Client ID
if [ -z "$REACT_APP_GOOGLE_CLIENT_ID" ]; then
    echo -e "${RED}❌ REACT_APP_GOOGLE_CLIENT_ID is not set${NC}"
    ERRORS=1
else
    echo -e "${GREEN}✅ REACT_APP_GOOGLE_CLIENT_ID is set${NC}"
    echo "   Value: ${REACT_APP_GOOGLE_CLIENT_ID:0:30}..."
fi

# Check API Key
if [ -z "$REACT_APP_GOOGLE_API_KEY" ]; then
    echo -e "${RED}❌ REACT_APP_GOOGLE_API_KEY is not set${NC}"
    ERRORS=1
else
    echo -e "${GREEN}✅ REACT_APP_GOOGLE_API_KEY is set${NC}"
    echo "   Value: ${REACT_APP_GOOGLE_API_KEY:0:20}..."
fi

# Check Spreadsheet ID
if [ -z "$REACT_APP_SPREADSHEET_ID" ]; then
    echo -e "${RED}❌ REACT_APP_SPREADSHEET_ID is not set${NC}"
    ERRORS=1
else
    echo -e "${GREEN}✅ REACT_APP_SPREADSHEET_ID is set${NC}"
    echo "   Value: ${REACT_APP_SPREADSHEET_ID}"
fi

echo ""
echo "📋 Required OAuth Setup Checklist:"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo ""
echo "2. Edit your OAuth 2.0 Client ID"
echo ""
echo "3. Add these Authorized JavaScript origins:"
echo "   - https://janice-dashboard.vercel.app"
echo "   - http://localhost:3000"
echo ""
echo "4. Add these Authorized redirect URIs:"
echo "   - https://janice-dashboard.vercel.app/"
echo "   - http://localhost:3000/"
echo "   ${YELLOW}(Note the trailing slash!)${NC}"
echo ""
echo "5. Make sure these APIs are enabled:"
echo "   - Google Sheets API"
echo "   - Google Drive API (optional but recommended)"
echo ""

if [ ! -z "$ERRORS" ]; then
    echo -e "${RED}⚠️  Some environment variables are missing!${NC}"
    echo "   Set them in Vercel: Project → Settings → Environment Variables"
    exit 1
else
    echo -e "${GREEN}✅ All environment variables are set!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make sure OAuth settings are correct in Google Cloud Console"
    echo "2. Deploy to Vercel: git push origin main"
    echo "3. Test the sync at: https://janice-dashboard.vercel.app"
    exit 0
fi

