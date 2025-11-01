# Commission Dashboard - Technical Documentation

**Version:** 3.14.1  
**Last Updated:** October 28, 2025  
**Author:** Dana Dube

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Commission Calculations](#commission-calculations)
5. [Google Sheets Integration](#google-sheets-integration)
6. [API & Service Layer](#api--service-layer)
7. [State Management](#state-management)
8. [UI Components](#ui-components)
9. [Environment Variables](#environment-variables)
10. [Integration Points](#integration-points)
11. [Data Flow](#data-flow)
12. [Field Reference](#field-reference)

---

## Overview

The Commission Dashboard is a React-based single-page application for tracking real estate commissions, transactions, and performance metrics. It features:

- **Two-way Google Sheets synchronization** via OAuth 2.0
- **Automatic commission calculations** for KW (Keller Williams) and BDH (Bennion Deville Homes) brokerages
- **Real-time analytics** with interactive charts and metrics
- **Offline-first architecture** with localStorage backup
- **AI-powered commission sheet scanning** using OpenAI Vision API

---

## Architecture

### Tech Stack

- **Frontend Framework:** React 18.2.0 (functional components with hooks)
- **Styling:** Tailwind CSS with custom HSB color system
- **Charts:** Recharts 2.10.0
- **Icons:** Lucide React 0.294.0
- **Google APIs:** gapi-script 1.2.0
- **Build Tool:** Create React App (react-scripts 5.0.1)
- **Deployment:** Vercel (serverless functions)

### Application Structure

```
commission-dashboard/
├── public/
│   ├── index.html                    # Main HTML with Tailwind config
│   └── assets/
│       ├── logos/                    # App logos (light/dark/default)
│       └── [commission-sheet-pdfs]    # Sample commission sheets
├── src/
│   ├── RealEstateDashboard.jsx      # Main dashboard component (3583 lines)
│   ├── googleSheetsService.js        # Google Sheets API service layer
│   ├── ThemeContext.jsx              # Theme management (light/dark/system)
│   ├── ThemeToggle.jsx               # Theme toggle component
│   └── index.js                      # React app entry point
├── api/
│   ├── auth/
│   │   └── google.js                 # OAuth serverless function (backup)
│   └── scan-commission-sheet.js      # OpenAI Vision API serverless function
├── package.json                      # Dependencies and scripts
├── vercel.json                       # Vercel deployment configuration
└── env.example                       # Environment variables template
```

### Key Design Patterns

1. **Single Component Architecture:** Main logic in `RealEstateDashboard.jsx`
2. **Service Layer:** Google Sheets operations abstracted to `googleSheetsService.js`
3. **Local-First:** All data persisted to localStorage with Google Sheets sync as enhancement
4. **Serverless API:** Commission sheet scanning via Vercel serverless function
5. **Theme System:** Context-based theme management with system preference detection

---

## Data Model

### Transaction Object Schema

Each transaction is a JavaScript object with the following fields:

```javascript
{
  // ID & Metadata
  id: string,                    // Unique identifier (UUID or "sheet-{index}")
  
  // Basic Information
  propertyType: string,          // "Residential" | "Commercial" | "Land"
  clientType: string,            // "Buyer" | "Seller"
  transactionType: string,       // "Sale" | "Referral $ Received" | "Referral $ Paid"
  source: string,                // Lead source (optional)
  address: string,               // Property address
  city: string,                  // Property city
  state: string,                 // Property state (default: "CA")
  zip: string,                   // Property zip code (optional)
  
  // Dates & Pricing
  listPrice: number,             // List price ($)
  closedPrice: number,           // Final sale price ($)
  listDate: string,              // YYYY-MM-DD or MM/DD/YYYY format
  closingDate: string,           // YYYY-MM-DD or MM/DD/YYYY format
  status: string,                // "Closed" | "Pending" | "Active"
  
  // Referral Fields (for referral transactions)
  referringAgent: string,       // Name of referring agent (optional)
  referralFeeReceived: number,  // Referral fee amount ($) - for "Referral $ Received"
  
  // Commission Fields
  brokerage: string,             // "Keller Williams" | "KW" | "Bennion Deville Homes" | "BDH"
  commissionPct: number,         // Commission percentage (e.g., 3.0 = 3%)
  referralPct: number,          // Referral percentage (e.g., 25.0 = 25%)
  referralDollar: number,       // Referral dollar amount (calculated)
  netVolume: number,            // Net sales volume (typically = closedPrice)
  
  // Calculated Fields (auto-computed, editable)
  gci: number,                   // Gross Commission Income ($)
  adjustedGci: number,          // Adjusted GCI after referral ($)
  totalBrokerageFees: number,   // Total brokerage deductions ($)
  nci: number,                  // Net Commission Income ($)
  
  // KW (Keller Williams) Specific Fields
  eo: number,                   // E&O Insurance ($)
  royalty: number,              // Royalty fee (auto: 6% of Adjusted GCI, editable)
  companyDollar: number,        // Company Dollar (auto: 10% of Adjusted GCI, editable)
  hoaTransfer: number,         // HOA Transfer fee ($)
  homeWarranty: number,        // Home Warranty ($)
  kwCares: number,             // KW Cares donation ($)
  kwNextGen: number,           // KW NextGen fee ($)
  boldScholarship: number,     // Bold Scholarship ($)
  tcConcierge: number,         // TC/Concierge fee ($)
  jelmbergTeam: number,        // Jelmberg Team fee ($)
  
  // BDH (Bennion Deville Homes) Specific Fields
  bdhSplitPct: number,         // Agent split percentage (default: 94)
  preSplitDeduction: number,   // Pre-split deduction (auto: 6% of Adjusted GCI, editable)
  asf: number,                 // ASF fee ($)
  foundation10: number,        // Foundation 10 fee ($)
  adminFee: number,            // Admin fee ($)
  
  // Universal Deductions
  otherDeductions: number,     // Other miscellaneous deductions ($)
  buyersAgentSplit: number,   // Buyer's agent split ($)
  assistantBonus: number,      // Assistant bonus (informational only, not in calculations)
  
  // Metadata
  notes: string                // Optional transaction notes
}
```

### Data Types

- **Numbers:** All monetary values stored as numbers (not strings)
- **Dates:** Stored as strings in YYYY-MM-DD format (HTML date input format)
- **Percentages:** Stored as decimals (3.0 = 3%) in calculations, displayed as "3%" in UI
- **Brokerage:** Normalized to full names ("Keller Williams", "Bennion Deville Homes")

---

## Commission Calculations

### Calculation Flow

The `calculateCommission(data)` function performs all commission calculations. It handles three transaction types differently:

### 1. Regular Sale Transaction

**Formula Chain:**

```
1. GCI (Gross Commission Income)
   GCI = Closed Price × (Commission % ÷ 100)

2. Referral Dollar (if applicable)
   Referral $ = GCI × (Referral % ÷ 100)

3. Adjusted GCI
   Adjusted GCI = GCI - Referral $

4. Brokerage Fees (brokerage-specific, see below)

5. NCI (Net Commission Income)
   NCI = Adjusted GCI - Total Brokerage Fees
```

### 2. Referral $ Received Transaction

When `transactionType === "Referral $ Received"`:

```
1. GCI = referralFeeReceived (flat fee, no property price calculation)
2. Referral Dollar = 0 (you're receiving, not paying)
3. Adjusted GCI = GCI (no adjustment)
4. Brokerage Fees = calculated normally (may be minimal)
5. NCI = Adjusted GCI - Total Brokerage Fees
```

### 3. Referral $ Paid Transaction

When `transactionType === "Referral $ Paid"`:

```
1. GCI = Closed Price × (Commission % ÷ 100) [normal calculation]
2. Referral Dollar = GCI × (Referral % ÷ 100) [you pay this]
3. Adjusted GCI = GCI - Referral $
4. Brokerage Fees = calculated normally
5. NCI = Adjusted GCI - Total Brokerage Fees
```

### Brokerage-Specific Calculations

#### Keller Williams (KW) Calculation

```javascript
// Step 1: Calculate or use manual override for Royalty
Royalty = manualValue || (Adjusted GCI × 0.06)  // 6% default

// Step 2: Calculate or use manual override for Company Dollar
Company Dollar = manualValue || (Adjusted GCI × 0.10)  // 10% default

// Step 3: Sum all KW deductions
Total Brokerage Fees = 
  E&O +
  Royalty +
  Company Dollar +
  HOA Transfer +
  Home Warranty +
  KW Cares +
  KW NextGen +
  Bold Scholarship +
  TC/Concierge +
  Jelmberg Team +
  Other Deductions +
  Buyer's Agent Split

// Step 4: Calculate NCI
NCI = Adjusted GCI - Total Brokerage Fees
```

**KW Fields:**
- `royalty` and `companyDollar` are **auto-calculated** but **editable** (manual override supported)
- If user manually edits these fields, calculations use the manual values
- All other KW fields are direct input values

#### Bennion Deville Homes (BDH) Calculation

```javascript
// Step 1: Calculate or use manual override for Pre-Split Deduction
Pre-Split Deduction = manualValue || (Adjusted GCI × 0.06)  // 6% default

// Step 2: Calculate after pre-split
After Pre-Split = Adjusted GCI - Pre-Split Deduction

// Step 3: Calculate agent split (default 94%)
Agent Split = After Pre-Split × (BDH Split % ÷ 100)

// Step 4: Calculate brokerage portion
Brokerage Portion = Adjusted GCI - Agent Split

// Step 5: Sum all BDH deductions
Total Brokerage Fees = 
  Pre-Split Deduction +
  Brokerage Portion +
  ASF +
  Foundation 10 +
  Admin Fee +
  Other Deductions +
  Buyer's Agent Split

// Step 6: Calculate NCI
NCI = Adjusted GCI - Total Brokerage Fees
```

**BDH Fields:**
- `preSplitDeduction` is **auto-calculated** but **editable** (manual override supported)
- `bdhSplitPct` defaults to 94% (editable)
- All other BDH fields are direct input values

### Bidirectional Calculations

The form supports **bidirectional calculations** for key fields:

#### GCI ↔ Commission Percentage

```javascript
// If user enters GCI manually:
Commission % = (GCI ÷ Closed Price) × 100

// If user enters Commission %:
GCI = Closed Price × (Commission % ÷ 100)
```

#### Referral Dollar ↔ Referral Percentage

```javascript
// If user enters Referral $ manually:
Referral % = (Referral $ ÷ GCI) × 100

// If user enters Referral %:
Referral $ = GCI × (Referral % ÷ 100)
```

### Auto-Calculation Triggers

Calculations automatically update when these fields change:

- `closedPrice`
- `commissionPct`
- `referralPct`
- `brokerage`
- `transactionType`
- `referralFeeReceived`
- Any deduction field (EO, HOA Transfer, etc.)

**Exception:** If a user manually edits a calculated field (`gci`, `adjustedGci`, `royalty`, `companyDollar`, `preSplitDeduction`, `totalBrokerageFees`, `nci`), auto-calculation for that field is disabled to preserve user intent.

---

## Google Sheets Integration

### Authentication

**OAuth 2.0 Implicit Flow** (full-page redirect, no popup issues):

1. User clicks "Enable Google Sheets Sync"
2. App redirects to Google OAuth consent screen
3. User authorizes access
4. Google redirects back with `access_token` in URL hash
5. Token stored in `sessionStorage` with expiry time
6. Token automatically set in GAPI client

**Token Management:**
- Stored in `sessionStorage` (cleared on browser close)
- Expiry tracked: `google_token_expires` timestamp
- Auto-validation: `hasValidToken()` checks expiry
- Token refresh: Full re-authentication required on expiry

### Spreadsheet Schema

**Sheet Name:** `Transactions`  
**Data Range:** `A2:Z` (row 1 = headers, data starts at row 2)  
**Columns (A-Z):**

| Column | Field Name | Type | Description |
|--------|-----------|------|-------------|
| A | propertyType | string | "Residential", "Commercial", "Land" |
| B | clientType | string | "Buyer", "Seller" |
| C | source | string | Lead source |
| D | address | string | Property address |
| E | city | string | Property city |
| F | listPrice | number | List price (no $) |
| G | commissionPct | number | Commission % (decimal: 3.0 = 3%) |
| H | listDate | string | YYYY-MM-DD or MM/DD/YYYY |
| I | closingDate | string | YYYY-MM-DD or MM/DD/YYYY |
| J | brokerage | string | "Keller Williams", "BDH" |
| K | netVolume | number | Net volume (typically = closedPrice) |
| L | closedPrice | number | Closed price (no $) |
| M | gci | number | Gross Commission Income |
| N | referralPct | number | Referral % (decimal: 25.0 = 25%) |
| O | referralDollar | number | Referral dollar amount |
| P | adjustedGci | number | Adjusted GCI after referral |
| Q | preSplitDeduction | number | Pre-split deduction (BDH) |
| R | totalBrokerageFees | number | Total brokerage fees |
| S | otherDeductions | number | Other deductions |
| T | nci | number | Net Commission Income |
| U | status | string | "Closed", "Pending", "Active" |
| V | assistantBonus | number | Assistant bonus (FYI) |
| W | buyersAgentSplit | number | Buyer's agent split |
| X | transactionType | string | "Sale", "Referral $ Received", "Referral $ Paid" |
| Y | referringAgent | string | Referring agent name |
| Z | referralFeeReceived | number | Referral fee received ($) |

### Sync Operations

#### Read (`readTransactions()`)

1. Validates authentication token
2. Calls Google Sheets API: `spreadsheets.values.get()`
3. Parses rows into transaction objects
4. Handles currency parsing (`parseCurrency()` strips $, commas)
5. Returns array of transaction objects

#### Write (`writeTransactions(transactions)`)

1. Validates authentication token
2. Maps transactions to row arrays (25 columns)
3. Clears existing data in range
4. Writes new data: `spreadsheets.values.update()`
5. Uses `valueInputOption: 'USER_ENTERED'` (allows formulas, formatting)

#### Auto-Sync Triggers

Data syncs to Google Sheets automatically on:

- **Create:** Adding new transaction
- **Update:** Editing existing transaction
- **Delete:** Removing transaction
- **App Start:** Auto-sync on app load (if authorized)
- **Manual:** "Sync Now" button click

**Fallback:** If sync fails, data still saved to localStorage.

### Error Handling

- **401/403 Errors:** Token expired, triggers re-authentication prompt
- **Network Errors:** Falls back to localStorage, shows sync error message
- **Parsing Errors:** Graceful degradation, logs to console
- **Rate Limiting:** Google Sheets API limits apply (100 requests/100 seconds/user)

---

## API & Service Layer

### Google Sheets Service (`googleSheetsService.js`)

**Exported Functions:**

```javascript
// Initialization
initialize()                    // Initialize GAPI client
initializeGoogleSheets()         // Alias for initialize()

// Authentication
signIn()                        // Start OAuth flow (redirects)
signOut()                       // Revoke token, clear storage
hasValidToken()                 // Check if token exists and not expired
isAuthorized()                  // Alias for hasValidToken()
authorizeUser()                 // Alias for signIn()
signOutUser()                   // Alias for signOut()

// CRUD Operations
readTransactions()              // Read all transactions from sheet
writeTransactions(transactions)  // Write all transactions to sheet
addTransaction(transaction)      // Add single transaction
updateTransaction(transaction)   // Update single transaction
deleteTransaction(transactionId) // Delete transaction by ID

// Backward Compatibility Aliases
readFromGoogleSheets()          // Alias for readTransactions()
writeToGoogleSheets()           // Alias for writeTransactions()
addToGoogleSheets()             // Alias for addTransaction()
updateInGoogleSheets()          // Alias for updateTransaction()
deleteFromGoogleSheets()        // Alias for deleteTransaction()
```

### Commission Sheet Scanner API (`/api/scan-commission-sheet`)

**Endpoint:** `POST /api/scan-commission-sheet`  
**Authentication:** Requires `OPENAI_API_KEY` in Vercel environment variables

**Request:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Response:**
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

**Error Response:**
```json
{
  "error": "Failed to scan commission sheet",
  "message": "OpenAI API error details"
}
```

**Model:** GPT-4 Omni (gpt-4o) with Vision API  
**Temperature:** 0.1 (low for consistent extraction)  
**Max Tokens:** 1000

---

## State Management

### React State Hooks

The app uses **React useState** hooks for all state management (no Redux/Context for data):

#### Primary State

```javascript
const [transactions, setTransactions] = useState([]);           // All transactions
const [showForm, setShowForm] = useState(false);              // Show add/edit form
const [editingId, setEditingId] = useState(null);            // ID of transaction being edited
const [viewingTransaction, setViewingTransaction] = useState(null); // Transaction detail view
const [showSettings, setShowSettings] = useState(false);      // Settings modal
```

#### Google Sheets State

```javascript
const [isGoogleSheetsEnabled, setIsGoogleSheetsEnabled] = useState(false);
const [isGoogleSheetsAuthorized, setIsGoogleSheetsAuthorized] = useState(false);
const [isSyncing, setIsSyncing] = useState(false);
const [syncError, setSyncError] = useState(null);
const [lastSyncTime, setLastSyncTime] = useState(null);
const [isOnline, setIsOnline] = useState(navigator.onLine);
```

#### Filter State

```javascript
const [filterYear, setFilterYear] = useState('all');
const [filterClientType, setFilterClientType] = useState('all');
const [filterBrokerage, setFilterBrokerage] = useState('all');
const [filterPropertyType, setFilterPropertyType] = useState('all');
const [filterPriceRange, setFilterPriceRange] = useState('all');
const [filterDateRange, setFilterDateRange] = useState('all');
const [filterReferralType, setFilterReferralType] = useState('all');
```

#### Search & Sort State

```javascript
const [searchQuery, setSearchQuery] = useState('');
const [isSearchFocused, setIsSearchFocused] = useState(false);
const [sortState, setSortState] = useState({
  order: localStorage.getItem('transactionSortOrder') || 'newest',
  version: 0
});
```

#### Customization State

```javascript
const [customLogo, setCustomLogo] = useState(() => 
  localStorage.getItem('customLogo') || '/assets/logos/app-logo-default.png'
);
const [agentName, setAgentName] = useState(() => 
  localStorage.getItem('agentName') || ''
);
const [agentCompany, setAgentCompany] = useState(() => 
  localStorage.getItem('agentCompany') || ''
);
```

### localStorage Persistence

**Keys Used:**

- `realEstateTransactions` - All transaction data (JSON string)
- `googleSheetsEnabled` - Boolean string ("true"/"false")
- `customLogo` - Logo file path
- `agentName` - Agent name
- `agentCompany` - Agent company name
- `transactionSortOrder` - "newest" or "oldest"

**Session Storage:**

- `google_access_token` - OAuth access token
- `google_token_expires` - Token expiry timestamp

### Computed Values (useMemo)

Heavy computations use `useMemo` for performance:

```javascript
const filteredTransactions = useMemo(() => {
  // Filter logic based on all filter states and search query
}, [transactions, filterYear, filterClientType, ..., searchQuery]);

const metrics = useMemo(() => {
  // Calculate totals, averages from filtered transactions
}, [filteredTransactions]);

const insights = useMemo(() => {
  // Calculate smart insights from filtered transactions
}, [filteredTransactions]);
```

---

## UI Components

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, Title, Sync Status, Settings)             │
├─────────────────────────────────────────────────────────┤
│ Filter Bar (Year, Client Type, Brokerage, Property...) │
├─────────────────────────────────────────────────────────┤
│ Search Bar                                              │
├─────────────────────────────────────────────────────────┤
│ Metric Cards (6 cards: GCI, NCI, Volume, Avg, Referrals)│
├─────────────────────────────────────────────────────────┤
│ Charts Row (3 charts: Income Trend, Transactions, Pie) │
├─────────────────────────────────────────────────────────┤
│ Insights Cards (5 smart insights)                       │
├─────────────────────────────────────────────────────────┤
│ Transaction List (Filtered, Sorted)                     │
├─────────────────────────────────────────────────────────┤
│ Footer (Version, Author)                                │
└─────────────────────────────────────────────────────────┘
```

### Key UI Components

#### 1. Metric Cards

**6 Metric Cards Display:**

1. **Gross Commission** - Total GCI sum
2. **Net Commission** - Total NCI sum  
3. **Total Sales Volume** - Sum of closed prices
4. **Average Per Deal** - Average NCI per transaction
5. **Referral Fees Paid** - Sum of referral dollars paid
6. **Referral Fees Received** - Sum of referral fees received

**Styling:**
- HSB color system (sophisticated gradients)
- Glass morphism effect (backdrop blur)
- Hover animations (scale, translate)
- Click to filter transactions

#### 2. Charts

**Monthly Income Trend (Line Chart):**
- X-axis: Months (MMM format)
- Y-axis: NCI ($)
- Lines: Gross Income (gold), Net Income (green)
- Interactive tooltips

**Transactions by Month (Bar Chart):**
- X-axis: Months
- Y-axis: Transaction count
- Color: HSB blue gradient

**Transaction Type Distribution (Pie Chart):**
- Segments: Sale, Referral Out, Referral In
- HSB color palette

#### 3. Transaction Cards

**Color Coding:**
- **Blue:** Buyer transactions
- **Gold:** Seller transactions
- **Purple:** Referral transactions

**Display Fields:**
- Property type emoji + address
- Client type badge
- Closing date
- NCI (highlighted)
- Transaction type badge (if referral)
- Click to view full details

#### 4. Transaction Detail Modal

**Sections:**
1. **Property Information** (Home icon)
   - Address, City, Property Type, Client Type
2. **Transaction Details** (DollarSign icon)
   - Dates, Prices, Brokerage, Commission %
3. **Commission Summary** (TrendingUp icon)
   - GCI, Adjusted GCI, Total Fees, NCI
   - Breakdown of deductions

#### 5. Add/Edit Transaction Form

**Sections:**
1. **Basic Information**
   - Brokerage (full width)
   - Address, City (side by side)
   - Transaction Type, Property Type, Client Type, Source
   - List Date, Closing Date, Status
   - List Price, Closed Price
2. **Commission Information**
   - Commission %, Referral %, Referral $
   - GCI, Adjusted GCI (calculated)
3. **Brokerage Fees** (conditional based on brokerage)
   - KW: E&O, Royalty, Company Dollar, HOA, etc.
   - BDH: Pre-Split Deduction, ASF, Foundation 10, Admin Fee
   - Universal: Other Deductions, Buyer's Agent Split
4. **Summary**
   - Total Brokerage Fees, NCI (calculated)

**Field Types:**
- Currency inputs: `type="text"` with `$` prefix and decimal formatting
- Percentage inputs: `type="text"` with `%` suffix, stored as decimals
- Date inputs: `type="date"` (YYYY-MM-DD format)
- Text inputs: Standard text fields
- Dropdowns: Select elements for enums

---

## Environment Variables

### Required Variables

Create a `.env.local` file (or Vercel environment variables):

```env
# Google Sheets API
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=your-google-api-key
REACT_APP_SPREADSHEET_ID=your-google-sheet-id

# OpenAI API (for commission sheet scanning)
OPENAI_API_KEY=sk-...your-openai-api-key
```

### Google Cloud Console Setup

1. **Create OAuth 2.0 Credentials:**
   - Go to Google Cloud Console
   - APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Authorized JavaScript origins: `https://your-domain.vercel.app`
   - Authorized redirect URIs: `https://your-domain.vercel.app`
   - Copy Client ID to `REACT_APP_GOOGLE_CLIENT_ID`

2. **Enable Google Sheets API:**
   - APIs & Services > Library
   - Enable "Google Sheets API"

3. **Create API Key:**
   - APIs & Services > Credentials
   - Create API Key
   - Restrict to Google Sheets API
   - Copy to `REACT_APP_GOOGLE_API_KEY`

4. **Get Spreadsheet ID:**
   - Open your Google Sheet
   - URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - Copy `SPREADSHEET_ID` to `REACT_APP_SPREADSHEET_ID`

5. **Share Sheet:**
   - Share with service account email (if using service account)
   - OR share with Google account that authorized OAuth

---

## Integration Points

### For Embedding in Larger Application

#### 1. **Component Import**

```javascript
import RealEstateDashboard from './src/RealEstateDashboard';

// Use as standalone component
<RealEstateDashboard />
```

#### 2. **State Management Integration**

If using Redux/Context for global state:

- **Option A:** Keep local state, expose via ref:
```javascript
const dashboardRef = useRef();
// Access via dashboardRef.current.getTransactions()
```

- **Option B:** Lift state to parent:
```javascript
// Pass transactions and handlers as props
<RealEstateDashboard 
  transactions={transactions}
  onTransactionsChange={handleTransactionsChange}
/>
```

#### 3. **Theme Integration**

The app uses `ThemeContext.jsx` for theme management. To integrate with parent app theme:

```javascript
// Wrap in your theme provider, or
// Modify ThemeContext to read from parent theme system
```

#### 4. **Routing Integration**

If using React Router:

```javascript
<Route path="/commissions" component={RealEstateDashboard} />
```

#### 5. **Authentication Integration**

Current OAuth is Google-only. To integrate with parent auth:

- **Option A:** Pass auth token to Google Sheets service
- **Option B:** Modify `googleSheetsService.js` to accept external token
- **Option C:** Keep Google OAuth separate (current approach)

#### 6. **Data Storage Integration**

To use external database instead of localStorage:

1. Replace `localStorage.setItem('realEstateTransactions', ...)` calls
2. Create service layer: `databaseService.js`
3. Update `saveTransactions()` to call database API
4. Update `loadFromLocalStorage()` to load from database

#### 7. **API Integration**

Commission sheet scanner API can be:

- **Option A:** Keep as Vercel serverless function (current)
- **Option B:** Move to parent app's API server
- **Option C:** Call directly from parent app's backend

---

## Data Flow

### Application Startup

```
1. Component Mounts
   ↓
2. Load from localStorage (if exists)
   ↓
3. Check Google Sheets enabled (localStorage)
   ↓
4. If enabled:
   - Check OAuth token validity
   - If valid: Load from Google Sheets (overwrite localStorage)
   - If invalid: Show "Connect to Google Sheets" button
   ↓
5. Initialize theme (light/dark/system)
   ↓
6. Render dashboard with loaded data
```

### Adding Transaction

```
1. User clicks "Add Transaction"
   ↓
2. Form opens with default values
   ↓
3. User fills in fields
   ↓
4. Auto-calculations trigger on field changes
   ↓
5. User clicks "Save"
   ↓
6. Generate UUID for transaction ID
   ↓
7. Add to transactions array
   ↓
8. Save to localStorage
   ↓
9. If Google Sheets enabled:
   - Write to Google Sheets
   - Update lastSyncTime
   ↓
10. Close form, refresh UI
```

### Editing Transaction

```
1. User clicks "Edit" on transaction card
   ↓
2. Load transaction data into form
   ↓
3. Format dates for HTML date input (YYYY-MM-DD)
   ↓
4. Format currency/percentage for display ($, %)
   ↓
5. User modifies fields
   ↓
6. Auto-calculations trigger
   ↓
7. User clicks "Update"
   ↓
8. Parse formatted values back to numbers
   ↓
9. Find transaction by ID, update in array
   ↓
10. Save to localStorage
   ↓
11. If Google Sheets enabled:
    - Update in Google Sheets
   ↓
12. Close form, refresh UI
```

### Syncing with Google Sheets

```
1. User enables Google Sheets sync
   ↓
2. Redirect to Google OAuth
   ↓
3. User authorizes
   ↓
4. Return with access_token in URL hash
   ↓
5. Store token in sessionStorage
   ↓
6. Initialize GAPI client with token
   ↓
7. Read transactions from Google Sheets
   ↓
8. Merge with localStorage (Google Sheets takes precedence)
   ↓
9. Display transactions
   ↓
10. Set lastSyncTime
```

### Filtering & Searching

```
1. User applies filters or searches
   ↓
2. Filter state updates
   ↓
3. useMemo recomputes filteredTransactions
   ↓
4. Charts, metrics, insights recalculate
   ↓
5. Transaction list updates
   ↓
6. (No data persistence - filters are ephemeral)
```

---

## Field Reference

### Complete Field List with Descriptions

#### Basic Information Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|------------|------------|
| `propertyType` | string | Yes (add) | "Residential", "Commercial", "Land" | Enum |
| `clientType` | string | Yes (add) | "Buyer", "Seller" | Enum |
| `transactionType` | string | Yes (add) | "Sale", "Referral $ Received", "Referral $ Paid" | Enum |
| `source` | string | No | Lead source | Text |
| `address` | string | Yes (add) | Property address | Text |
| `city` | string | Yes (add) | Property city | Text |
| `state` | string | No | Property state (default: "CA") | Text |
| `zip` | string | No | Property zip code | Text |
| `listPrice` | number | No | List price ($) | Number |
| `closedPrice` | number | Yes (add) | Final sale price ($) | Number > 0 |
| `listDate` | string | No | List date (YYYY-MM-DD) | Date |
| `closingDate` | string | Yes (add) | Closing date (YYYY-MM-DD) | Date |
| `status` | string | Yes (add) | "Closed", "Pending", "Active" | Enum |

#### Referral Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|------------|------------|
| `referringAgent` | string | No | Name of referring agent | Text |
| `referralFeeReceived` | number | Conditional | Referral fee ($) - required if `transactionType === "Referral $ Received"` | Number >= 0 |

#### Commission Fields

| Field | Type | Required | Description | Validation | Auto-Calculated |
|-------|------|----------|------------|------------|----------------|
| `brokerage` | string | Yes (add) | "Keller Williams", "KW", "Bennion Deville Homes", "BDH" | Enum | No |
| `commissionPct` | number | Yes (add) | Commission percentage (3.0 = 3%) | Number 0-100 | No |
| `referralPct` | number | No | Referral percentage (25.0 = 25%) | Number 0-100 | No |
| `referralDollar` | number | No | Referral dollar amount ($) | Number >= 0 | Yes |
| `netVolume` | number | No | Net sales volume (typically = closedPrice) | Number >= 0 | Yes |
| `gci` | number | No | Gross Commission Income ($) | Number >= 0 | Yes (editable) |
| `adjustedGci` | number | No | Adjusted GCI after referral ($) | Number >= 0 | Yes (editable) |
| `totalBrokerageFees` | number | No | Total brokerage deductions ($) | Number >= 0 | Yes (editable) |
| `nci` | number | No | Net Commission Income ($) | Number >= 0 | Yes (editable) |

#### KW (Keller Williams) Specific Fields

| Field | Type | Required | Description | Validation | Auto-Calculated |
|-------|------|----------|------------|------------|----------------|
| `eo` | number | No | E&O Insurance ($) | Number >= 0 | No |
| `royalty` | number | No | Royalty fee (6% of Adjusted GCI default) | Number >= 0 | Yes (editable) |
| `companyDollar` | number | No | Company Dollar (10% of Adjusted GCI default) | Number >= 0 | Yes (editable) |
| `hoaTransfer` | number | No | HOA Transfer fee ($) | Number >= 0 | No |
| `homeWarranty` | number | No | Home Warranty ($) | Number >= 0 | No |
| `kwCares` | number | No | KW Cares donation ($) | Number >= 0 | No |
| `kwNextGen` | number | No | KW NextGen fee ($) | Number >= 0 | No |
| `boldScholarship` | number | No | Bold Scholarship ($) | Number >= 0 | No |
| `tcConcierge` | number | No | TC/Concierge fee ($) | Number >= 0 | No |
| `jelmbergTeam` | number | No | Jelmberg Team fee ($) | Number >= 0 | No |

#### BDH (Bennion Deville Homes) Specific Fields

| Field | Type | Required | Description | Validation | Auto-Calculated |
|-------|------|----------|------------|------------|----------------|
| `bdhSplitPct` | number | No | Agent split percentage (default: 94) | Number 0-100 | No |
| `preSplitDeduction` | number | No | Pre-split deduction (6% of Adjusted GCI default) | Number >= 0 | Yes (editable) |
| `asf` | number | No | ASF fee ($) | Number >= 0 | No |
| `foundation10` | number | No | Foundation 10 fee ($) | Number >= 0 | No |
| `adminFee` | number | No | Admin fee ($) | Number >= 0 | No |

#### Universal Deductions

| Field | Type | Required | Description | Validation |
|-------|------|----------|------------|------------|
| `otherDeductions` | number | No | Other miscellaneous deductions ($) | Number >= 0 |
| `buyersAgentSplit` | number | No | Buyer's agent split ($) | Number >= 0 |
| `assistantBonus` | number | No | Assistant bonus ($) - informational only, not in calculations | Number >= 0 |

#### Metadata

| Field | Type | Required | Description |
|-------|------|----------|------------|
| `id` | string | Yes | Unique identifier (UUID or "sheet-{index}") |
| `notes` | string | No | Optional transaction notes |

---

## Additional Notes

### Currency Formatting

- **Display:** All dollar amounts show with `$` prefix, comma separators, and 2 decimal places (e.g., `$12,345.67`)
- **Storage:** Stored as numbers (no formatting)
- **Input:** Currency inputs accept `$` and commas, auto-format on blur
- **Formatting Function:** `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`

### Percentage Formatting

- **Display:** Percentages show with `%` suffix as whole numbers (e.g., `3%`)
- **Storage:** Stored as decimals (3.0 = 3%)
- **Input:** Percentage inputs accept `%`, convert to decimal for storage
- **Conversion:** Display = Storage × 100, Storage = Display ÷ 100

### Date Handling

- **Display:** `MM/DD/YYYY` format (e.g., "01/15/2025")
- **Storage:** `YYYY-MM-DD` format for HTML date inputs
- **Parsing:** Handles both formats when loading from Google Sheets

### Brokerage Normalization

- **Display:** Full names ("Keller Williams", "Bennion Deville Homes")
- **Storage:** Full names preferred
- **Filter Matching:** Handles abbreviations ("KW", "BDH") in filter logic

### Referral Transaction Types

- **"Sale":** Regular property sale transaction
- **"Referral $ Received":** You refer client to another agent, receive referral fee (flat fee, no property price)
- **"Referral $ Paid":** Another agent refers client to you, you pay referral fee (calculated from property price)

---

## Troubleshooting

### Common Issues

1. **Google Sheets sync fails:**
   - Check OAuth token expiry (1 hour default)
   - Verify `REACT_APP_SPREADSHEET_ID` is correct
   - Check spreadsheet is shared with authorized Google account

2. **Calculations incorrect:**
   - Verify brokerage type matches actual brokerage
   - Check if manual overrides are interfering
   - Review transaction type (Sale vs Referral)

3. **Data not persisting:**
   - Check browser localStorage quota
   - Verify Google Sheets write permissions
   - Check network connection for sync

4. **Commission sheet scan fails:**
   - Verify `OPENAI_API_KEY` in Vercel environment variables
   - Check image format (PNG, JPG, WebP - not PDF)
   - Review API usage limits

---

## Version History

- **v3.14.1** (Oct 28, 2025): UI/UX redesign, HSB color system, form optimization
- **v3.13.0**: Search functionality, filter improvements
- **v3.5.0**: Referral transaction types added
- **v3.3.3**: macOS Tahoe design, glass morphism
- **v3.0.0**: Initial release with Google Sheets integration

---

## Contact & Support

- **Developer:** Dana Dube
- **Repository:** [github.com/danadube/commission-dashboard](https://github.com/danadube/commission-dashboard)
- **Live App:** [realestate-commission-dashboard.vercel.app](https://realestate-commission-dashboard.vercel.app)

---

**Last Updated:** October 28, 2025  
**Documentation Version:** 1.0

