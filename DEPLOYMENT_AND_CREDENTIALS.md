# Commission Dashboard - Deployment & Credentials Guide

**Version:** 3.14.1  
**Last Updated:** October 28, 2025  
**Author:** Dana Dube

---

## Table of Contents

1. [Commission Sheet Import System](#commission-sheet-import-system)
2. [Credentials Setup](#credentials-setup)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [TypeScript/JavaScript Configuration](#typescriptjavascript-configuration)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)

---

## Commission Sheet Import System

### Overview

The Commission Dashboard includes an **AI-powered commission sheet scanner** that automatically extracts transaction data from commission sheet images using OpenAI's Vision API (GPT-4 Omni).

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User uploads commission sheet image (JPG, PNG, WebP)    │
│    via "Scan Commission Sheet" button in transaction form   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend converts image to base64 string                  │
│    - FileReader API reads image file                         │
│    - Converts to data URI (data:image/png;base64,...)      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend sends POST request to serverless function       │
│    POST /api/scan-commission-sheet                          │
│    Body: { imageBase64: "data:image/png;base64,..." }       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Vercel serverless function calls OpenAI Vision API      │
│    - Model: gpt-4o (GPT-4 Omni)                            │
│    - Temperature: 0.1 (low for consistent extraction)    │
│    - System prompt instructs AI to extract JSON data        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OpenAI returns extracted transaction data as JSON        │
│    {                                                         │
│      transactionType, propertyType, clientType,             │
│      address, city, dates, prices, commission %,           │
│      brokerage fees, NCI, confidence score, etc.            │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Serverless function returns extracted data to frontend  │
│    { success: true, data: {...}, usage: {...} }            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Frontend auto-fills transaction form with extracted data│
│    - Only fills fields that were successfully extracted     │
│    - Shows confidence score to user                        │
│    - User reviews and can edit before saving               │
└─────────────────────────────────────────────────────────────┘
```

### Supported File Formats

- ✅ **JPG/JPEG** - Full support
- ✅ **PNG** - Full support
- ✅ **WebP** - Full support
- ❌ **PDF** - Not supported (OpenAI Vision API limitation)
  - **Workaround:** Take a screenshot of the PDF (Cmd+Shift+4 on Mac, Windows+S on Windows)

### File Size Limits

- **Maximum:** 20MB per image
- **Recommended:** Under 5MB for faster processing

### Supported Commission Sheet Types

- ✅ **Keller Williams (KW)** commission sheets
- ✅ **Bennion Deville Homes (BDH)** commission sheets
- ✅ **Generic** commission sheets (auto-detects structure)

### Data Extraction Capabilities

The AI extracts the following fields from commission sheets:

| Field | Detection Accuracy | Notes |
|-------|-------------------|-------|
| Transaction Type | High | Detects Sale, Referral Out, Referral In |
| Property Type | High | Residential, Commercial, Land |
| Client Type | High | Buyer, Seller |
| Address | High | Street address |
| City | High | City name |
| List Price | High | Monetary value |
| Closed Price | High | Monetary value |
| Dates | High | List date, closing date (converted to YYYY-MM-DD) |
| Brokerage | Medium | Detects KW or BDH |
| Commission % | High | Percentage value |
| GCI | High | Gross Commission Income |
| Referral %/$ | Medium | If present on sheet |
| Adjusted GCI | High | After referral deduction |
| Brokerage Fees | Medium | KW-specific (Royalty, Company Dollar) or BDH-specific |
| NCI | High | Net Commission Income |
| Status | Low | Often inferred (Closed, Pending, Active) |
| Referring Agent | Medium | If present on sheet |

**Confidence Score:** Each extraction includes a confidence score (0-100%) indicating the AI's certainty level.

### API Endpoint

**Endpoint:** `POST /api/scan-commission-sheet`

**Request:**
```javascript
fetch('/api/scan-commission-sheet', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: 'data:image/png;base64,iVBORw0KGgo...'
  })
});
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "transactionType": "Sale",
    "propertyType": "Residential",
    "clientType": "Buyer",
    "address": "123 Main St",
    "city": "Los Angeles",
    "listPrice": 500000,
    "closedPrice": 495000,
    "listDate": "2025-01-15",
    "closingDate": "2025-02-20",
    "brokerage": "KW",
    "commissionPct": 3.0,
    "gci": 14850,
    "referralPct": 0,
    "referralDollar": 0,
    "adjustedGci": 14850,
    "totalBrokerageFees": 2376,
    "nci": 12474,
    "status": "Closed",
    "referringAgent": null,
    "referralFeeReceived": 0,
    "confidence": 92
  },
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 300,
    "total_tokens": 1800
  }
}
```

**Response (Error):**
```json
{
  "error": "Failed to scan commission sheet",
  "message": "OpenAI API error details"
}
```

### Serverless Function Code

Located at: `api/scan-commission-sheet.js`

**Key Features:**
- Validates image file (POST request only)
- Extracts base64 image from request body
- Calls OpenAI Vision API with structured prompt
- Parses JSON response (handles markdown code blocks)
- Returns extracted data or error

**Security:**
- ✅ API key stored securely in Vercel environment variables
- ✅ Never exposed to client-side code
- ✅ Server-side only processing

### Frontend Integration

**Location:** `src/RealEstateDashboard.jsx`

**Key Functions:**
- `handleScanCommissionSheet(event)` - Handles file upload
- Validates file type and size
- Converts to base64 via FileReader API
- Calls serverless function
- Auto-fills form with extracted data
- Shows loading state and error messages

**UI Component:**
- Located in transaction form modal
- File input with custom styled button
- Loading spinner during scan
- Error message display
- Success notification with confidence score

### Usage Tips

1. **Best Results:**
   - Use clear, high-resolution images
   - Ensure all text is readable
   - Crop to commission sheet area only

2. **PDF Handling:**
   - Take a screenshot of the PDF page
   - Save as PNG or JPG
   - Upload the screenshot

3. **Review Before Saving:**
   - Always review extracted data
   - Verify monetary values
   - Check dates are correct
   - Confirm brokerage type

4. **Manual Corrections:**
   - Form remains fully editable after scan
   - You can modify any extracted field
   - Calculations will auto-update based on your edits

---

## Credentials Setup

### Required Credentials

You need **4 sets of credentials** to run the full application:

1. **Google Cloud Platform** (3 credentials)
   - Google API Key
   - Google OAuth Client ID
   - Google Spreadsheet ID

2. **OpenAI** (1 credential)
   - OpenAI API Key

### Google Cloud Platform Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Commission Dashboard`
4. Click **"Create"**

#### Step 2: Enable Google Sheets API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click **"Enable"**

#### Step 3: Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copy the API key (starts with `AIza...`)
4. **Restrict the API Key:**
   - Click **"Restrict key"**
   - Under **"API restrictions"**, select **"Restrict key"**
   - Choose **"Google Sheets API"**
   - Click **"Save"**

**Save this as:** `REACT_APP_GOOGLE_API_KEY`

#### Step 4: Create OAuth 2.0 Client ID

1. In **"Credentials"** page, click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. If prompted, configure OAuth consent screen:
   - **User Type:** External
   - **App name:** Commission Dashboard
   - **User support email:** Your email
   - **Developer contact:** Your email
   - Click **"Save and Continue"**
   - **Scopes:** Add `https://www.googleapis.com/auth/spreadsheets`
   - Click **"Save and Continue"**
   - **Test users:** Add your Google account email
   - Click **"Save and Continue"**
   - Click **"Back to Dashboard"**

3. **Create OAuth Client:**
   - **Application type:** Web application
   - **Name:** Commission Dashboard Web Client
   - **Authorized JavaScript origins:**
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app`
   - **Authorized redirect URIs:**
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app`
   - Click **"Create"**

4. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

**Save this as:** `REACT_APP_GOOGLE_CLIENT_ID`

**Note:** For production, add your Vercel domain to both authorized origins and redirect URIs.

#### Step 5: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it: `Commission Transactions`

4. **Set up the header row (Row 1):**
   - Column A: `Property Type`
   - Column B: `Client Type`
   - Column C: `Source`
   - Column D: `Address`
   - Column E: `City`
   - Column F: `List Price`
   - Column G: `Commission %`
   - Column H: `List Date`
   - Column I: `Closing Date`
   - Column J: `Brokerage`
   - Column K: `Net Volume`
   - Column L: `Closed Price`
   - Column M: `GCI`
   - Column N: `Referral %`
   - Column O: `Referral $`
   - Column P: `Adjusted GCI`
   - Column Q: `Pre-split Deduction`
   - Column R: `Brokerage Split`
   - Column S: `Admin Fees/Other Deductions`
   - Column T: `NCI`
   - Column U: `Status`
   - Column V: `Assistant Bonus`
   - Column W: `Buyer's Agent Split`
   - Column X: `Transaction Type`
   - Column Y: `Referring Agent`
   - Column Z: `Referral Fee Received`

5. **Share the spreadsheet:**
   - Click **"Share"** button
   - Add the Google account email you'll use for OAuth
   - Give **"Editor"** permissions
   - Click **"Send"**

6. **Get Spreadsheet ID:**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - Copy the `SPREADSHEET_ID` (long alphanumeric string)

**Save this as:** `REACT_APP_SPREADSHEET_ID`

### OpenAI API Setup

#### Step 1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in

#### Step 2: Add Payment Method

1. Go to **"Settings"** → **"Billing"**
2. Add a payment method (required for API access)
3. Set up usage limits if desired

#### Step 3: Create API Key

1. Go to **"API keys"** → **"Create new secret key"**
2. Name it: `Commission Dashboard Scanner`
3. Copy the API key (starts with `sk-...`)

**⚠️ Important:** This key will only be shown once. Save it immediately!

**Save this as:** `OPENAI_API_KEY`

#### Step 4: Understand Pricing

**GPT-4 Omni Vision API Pricing** (as of October 2025):
- **Input:** ~$0.005 per 1K tokens (images cost more)
- **Output:** ~$0.015 per 1K tokens
- **Average cost per commission sheet scan:** $0.05 - $0.15

**Recommendations:**
- Set up usage limits in OpenAI dashboard
- Monitor usage regularly
- Consider caching frequently scanned sheets

---

## Local Development Setup

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 8.x or higher (comes with Node.js)
- **Git** (for cloning repository)

### Step 1: Clone Repository

```bash
git clone https://github.com/danadube/commission-dashboard.git
cd commission-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- React 18.2.0
- React DOM 18.2.0
- Recharts 2.10.0 (charts)
- Lucide React 0.294.0 (icons)
- gapi-script 1.2.0 (Google APIs)
- react-scripts 5.0.1 (build tools)

### Step 3: Create Environment File

```bash
cp env.example .env.local
```

### Step 4: Add Credentials to .env.local

Edit `.env.local` and add your credentials:

```env
# Google API Key (from Google Cloud Console)
REACT_APP_GOOGLE_API_KEY=AIzaSy...your-api-key-here

# Google OAuth Client ID (from Google Cloud Console)
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com

# Google Spreadsheet ID (from Google Sheets URL)
REACT_APP_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q

# OpenAI API Key (from OpenAI Platform)
OPENAI_API_KEY=sk-proj-...your-openai-api-key-here
```

**Important Notes:**
- `.env.local` is already in `.gitignore` (won't be committed)
- Never commit credentials to Git
- Use different credentials for development vs production

### Step 5: Start Development Server

```bash
npm start
```

This will:
- Start the React development server
- Open `http://localhost:3000` in your browser
- Enable hot module reloading (auto-refresh on code changes)

### Step 6: Test Google Sheets Integration

1. Click **"Enable Google Sheets Sync"** in settings
2. Click **"Connect to Google Sheets"**
3. You'll be redirected to Google OAuth
4. Authorize the app
5. You'll be redirected back to the app
6. Data should load from your Google Sheet

### Step 7: Test Commission Sheet Scanner

1. Click **"Add Transaction"** button
2. Scroll to **"AI Commission Sheet Scanner"** section
3. Click **"📷 Scan Commission Sheet"**
4. Upload a commission sheet image (JPG, PNG, WebP)
5. Wait for scan to complete (10-30 seconds)
6. Review auto-filled data
7. Save transaction

### Development Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests (if configured)
npm test

# Eject from Create React App (not recommended)
npm run eject
```

---

## Production Deployment

### Deployment to Vercel

The app is configured for **Vercel** deployment (serverless functions for OpenAI API).

#### Step 1: Prepare for Deployment

1. **Build locally to test:**
   ```bash
   npm run build
   ```
   This creates a `build/` directory with optimized production files.

2. **Verify build succeeds:**
   - Check for any errors
   - Fix any issues before deploying

#### Step 2: Push to GitHub

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Verify `.env.local` is NOT committed:**
   ```bash
   git status
   ```
   `.env.local` should NOT appear in the list.

#### Step 3: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Select the repository: `commission-dashboard`

#### Step 4: Configure Vercel Project

1. **Framework Preset:** Create React App (auto-detected)
2. **Root Directory:** `./` (leave as default)
3. **Build Command:** `npm run build` (auto-detected)
4. **Output Directory:** `build` (auto-detected)
5. **Install Command:** `npm install` (auto-detected)

#### Step 5: Add Environment Variables in Vercel

1. In Vercel project settings, go to **"Environment Variables"**
2. Add all 4 environment variables:

   **For Production:**
   ```
   REACT_APP_GOOGLE_API_KEY=AIzaSy...your-production-api-key
   REACT_APP_GOOGLE_CLIENT_ID=123456789-...your-production-client-id.apps.googleusercontent.com
   REACT_APP_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q
   OPENAI_API_KEY=sk-proj-...your-production-openai-key
   ```

   **For Preview (optional):**
   - Use the same values or different test credentials

   **Note:**
   - `REACT_APP_*` variables are exposed to the browser (public)
   - `OPENAI_API_KEY` is server-side only (secure)

#### Step 6: Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run build command
   - Deploy to production
   - Provide a URL: `https://your-project.vercel.app`

#### Step 7: Update Google OAuth Settings

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Edit your OAuth 2.0 Client ID
4. Add to **"Authorized JavaScript origins":**
   - `https://your-project.vercel.app`
5. Add to **"Authorized redirect URIs":**
   - `https://your-project.vercel.app`
6. Click **"Save"**

#### Step 8: Test Production Deployment

1. Visit your Vercel URL
2. Test Google Sheets sync (should work)
3. Test commission sheet scanner (should work)
4. Verify all features work correctly

### Alternative Deployment Options

#### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the app:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Add environment variables in Netlify dashboard:**
   - Site settings → Environment variables
   - Add all 4 variables

**Note:** Netlify doesn't support serverless functions by default. You'll need to:
- Use Netlify Functions for the commission sheet scanner
- Convert `api/scan-commission-sheet.js` to Netlify function format

#### Deploy to Custom Server

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Upload `build/` directory to your server**

3. **Configure web server (Nginx example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/build;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           # Proxy to your API server
           proxy_pass http://localhost:3001;
       }
   }
   ```

4. **Set up API server for commission scanner:**
   - Convert `api/scan-commission-sheet.js` to your server framework
   - Ensure `OPENAI_API_KEY` is in server environment variables

---

## TypeScript/JavaScript Configuration

### Current Setup: JavaScript

The application is currently written in **JavaScript (JSX)**:

- **File Extensions:** `.js`, `.jsx`
- **Build Tool:** Create React App (CRA) with Babel
- **Type Checking:** ESLint only (no TypeScript)

### Converting to TypeScript

If you want to convert to TypeScript:

#### Step 1: Install TypeScript Dependencies

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

#### Step 2: Rename Files

```bash
# Rename main component
mv src/RealEstateDashboard.jsx src/RealEstateDashboard.tsx

# Rename service files
mv src/googleSheetsService.js src/googleSheetsService.ts
mv src/index.js src/index.tsx
mv src/ThemeContext.jsx src/ThemeContext.tsx
mv src/ThemeToggle.jsx src/ThemeToggle.tsx
```

#### Step 3: Create TypeScript Config

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

#### Step 4: Add Type Definitions

Create `src/types.ts`:

```typescript
export interface Transaction {
  id: string;
  propertyType: 'Residential' | 'Commercial' | 'Land';
  clientType: 'Buyer' | 'Seller';
  transactionType: 'Sale' | 'Referral $ Received' | 'Referral $ Paid';
  source?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  listPrice: number;
  closedPrice: number;
  listDate: string;
  closingDate: string;
  status: 'Closed' | 'Pending' | 'Active';
  referringAgent?: string;
  referralFeeReceived?: number;
  brokerage: 'Keller Williams' | 'KW' | 'Bennion Deville Homes' | 'BDH';
  commissionPct: number;
  referralPct?: number;
  referralDollar?: number;
  netVolume?: number;
  gci: number;
  adjustedGci: number;
  totalBrokerageFees: number;
  nci: number;
  // ... add all other fields
}
```

#### Step 5: Update Package.json

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "type-check": "tsc --noEmit"
  }
}
```

#### Step 6: Gradual Migration

- Start with type definitions
- Add types to function parameters and return values
- Fix type errors incrementally
- Use `@ts-ignore` temporarily for complex areas

### JavaScript Configuration (Current)

**Babel Configuration:**
- Handled by `react-scripts`
- Transpiles JSX to JavaScript
- Supports modern ES6+ features

**ESLint Configuration:**
```json
{
  "extends": ["react-app"]
}
```

**No Type Checking:**
- Currently relies on runtime errors
- Consider adding PropTypes for type safety:
```javascript
import PropTypes from 'prop-types';

RealEstateDashboard.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  // ...
};
```

---

## Environment Variables Reference

### Complete Environment Variables List

| Variable Name | Type | Required | Scope | Description |
|---------------|------|----------|-------|-------------|
| `REACT_APP_GOOGLE_API_KEY` | string | Yes | Client | Google Sheets API key |
| `REACT_APP_GOOGLE_CLIENT_ID` | string | Yes | Client | Google OAuth 2.0 Client ID |
| `REACT_APP_SPREADSHEET_ID` | string | Yes | Client | Google Spreadsheet ID |
| `OPENAI_API_KEY` | string | Yes | Server | OpenAI API key (serverless functions only) |

### Variable Scope Explained

#### Client-Side Variables (`REACT_APP_*`)

- **Exposed to browser:** Yes (visible in browser dev tools)
- **Usage:** Google Sheets API initialization, OAuth flow
- **Security:** These are safe to expose (they're public keys, not secrets)
- **Build-time:** Injected at build time, not runtime

**How to use in code:**
```javascript
const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
```

#### Server-Side Variables (No `REACT_APP_` prefix)

- **Exposed to browser:** No (server-only)
- **Usage:** API keys, database credentials, secrets
- **Security:** Keep these secure (never commit to Git)

**How to use in serverless functions:**
```javascript
// api/scan-commission-sheet.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
```

### Environment Variable Loading

#### Local Development

1. Create `.env.local` file in project root
2. Add variables: `REACT_APP_KEY=value`
3. Restart dev server: `npm start`
4. Variables are loaded automatically

**File Priority (CRA):**
- `.env.local` (highest priority, ignored by Git)
- `.env.development.local`
- `.env.development`
- `.env`

#### Production (Vercel)

1. Add variables in Vercel dashboard
2. Redeploy after adding/updating variables
3. Variables are injected at build time

**Important:** 
- Changes require rebuild/redeploy
- Variables are baked into the build, not runtime

### Example .env.local File

```env
# ============================================
# Google Cloud Platform Credentials
# ============================================
REACT_APP_GOOGLE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
REACT_APP_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t

# ============================================
# OpenAI API Credentials
# ============================================
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ

# ============================================
# Notes:
# - Never commit this file to Git
# - Use different credentials for dev/prod
# - REACT_APP_* variables are exposed to browser
# - OPENAI_API_KEY is server-side only
# ============================================
```

### Verifying Environment Variables

**Check in browser console (client-side only):**
```javascript
console.log('Google API Key:', process.env.REACT_APP_GOOGLE_API_KEY);
console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
console.log('Spreadsheet ID:', process.env.REACT_APP_SPREADSHEET_ID);
// OPENAI_API_KEY won't be accessible here (server-side only)
```

**Check in serverless function:**
```javascript
// api/scan-commission-sheet.js
console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
// Only log existence, never log the actual key
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Google Sheets Sync Not Working

**Symptoms:**
- "Not authenticated" error
- OAuth redirect fails
- Data doesn't load

**Solutions:**
- ✅ Verify `REACT_APP_GOOGLE_CLIENT_ID` is correct
- ✅ Check authorized JavaScript origins in Google Cloud Console
- ✅ Ensure redirect URI matches exactly (including protocol)
- ✅ Clear browser cache and try again
- ✅ Check Google Cloud Console for API quota limits

#### 2. Commission Sheet Scanner Fails

**Symptoms:**
- "OpenAI API key not configured" error
- Scan never completes
- "Failed to scan" error

**Solutions:**
- ✅ Verify `OPENAI_API_KEY` is set in Vercel environment variables
- ✅ Check OpenAI API key is valid and active
- ✅ Ensure payment method is added in OpenAI dashboard
- ✅ Check OpenAI API usage/quota limits
- ✅ Verify file is image format (JPG, PNG, WebP), not PDF

#### 3. Environment Variables Not Loading

**Symptoms:**
- `process.env.REACT_APP_*` is `undefined`
- Variables work locally but not in production

**Solutions:**
- ✅ Ensure variable name starts with `REACT_APP_` for client-side
- ✅ Restart dev server after changing `.env.local`
- ✅ Rebuild/redeploy after changing Vercel environment variables
- ✅ Check for typos in variable names
- ✅ Verify `.env.local` is in project root (not subdirectory)

#### 4. Build Fails in Production

**Symptoms:**
- Vercel build fails
- "Module not found" errors
- Type errors

**Solutions:**
- ✅ Run `npm run build` locally to catch errors early
- ✅ Check `package.json` dependencies are all listed
- ✅ Verify Node.js version in Vercel matches local (check `engines` in package.json)
- ✅ Clear `.next` or `build` directory and rebuild
- ✅ Check for import errors or missing files

#### 5. CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- API requests blocked by browser

**Solutions:**
- ✅ Verify OAuth redirect URIs match exactly
- ✅ Check Google Cloud Console CORS settings
- ✅ Ensure API key restrictions allow your domain
- ✅ For custom domains, update OAuth settings

#### 6. OpenAI API Rate Limits

**Symptoms:**
- "Rate limit exceeded" errors
- Scans work intermittently

**Solutions:**
- ✅ Check OpenAI dashboard for usage limits
- ✅ Implement request throttling/queuing
- ✅ Add retry logic with exponential backoff
- ✅ Consider upgrading OpenAI plan if needed

#### 7. Google Sheets API Quota Exceeded

**Symptoms:**
- "Quota exceeded" errors
- Sync fails after many requests

**Solutions:**
- ✅ Check Google Cloud Console quota dashboard
- ✅ Reduce auto-sync frequency
- ✅ Implement request caching
- ✅ Request quota increase if needed

### Getting Help

**Check Logs:**
- **Local:** Browser console (F12) and terminal output
- **Production:** Vercel deployment logs

**Debug Steps:**
1. Verify all credentials are correct
2. Check environment variables are set
3. Test locally first (`npm start`)
4. Check browser console for errors
5. Review serverless function logs in Vercel

**Contact:**
- **Repository:** [github.com/danadube/commission-dashboard](https://github.com/danadube/commission-dashboard)
- **Issues:** Create a GitHub issue with error details

---

## Quick Reference Checklist

### Initial Setup

- [ ] Create Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Create Google API Key
- [ ] Create OAuth 2.0 Client ID
- [ ] Create Google Spreadsheet
- [ ] Set up spreadsheet headers (A-Z)
- [ ] Share spreadsheet with your Google account
- [ ] Create OpenAI account
- [ ] Add payment method to OpenAI
- [ ] Create OpenAI API Key

### Local Development

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `env.example` to `.env.local`
- [ ] Add all credentials to `.env.local`
- [ ] Update Google OAuth settings for `localhost:3000`
- [ ] Run `npm start`
- [ ] Test Google Sheets sync
- [ ] Test commission sheet scanner

### Production Deployment

- [ ] Build locally: `npm run build`
- [ ] Verify build succeeds
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy to Vercel
- [ ] Update Google OAuth settings for production domain
- [ ] Test all features in production
- [ ] Set up custom domain (optional)

---

**Last Updated:** October 28, 2025  
**Documentation Version:** 1.0

