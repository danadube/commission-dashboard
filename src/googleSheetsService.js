/**
 * Google Sheets Service
 * 
 * Handles all Google Sheets API interactions with OAuth 2.0 authentication.
 * 
 * Features:
 * - OAuth 2.0 Implicit Flow (full-page redirect, no COOP issues)
 * - Read/Write/Update/Delete operations
 * - Token management and persistence
 * - Auto-sync on all CRUD operations
 * 
 * Column Mapping (A-Z, 25 columns):
 * A: Property Type, B: Client Type, C: Source, D: Address, E: City,
 * F: List Price, G: Commission %, H: List Date, I: Closing Date, J: Brokerage,
 * K: Net Volume, L: Closed Price, M: GCI, N: Referral %, O: Referral $,
 * P: Adjusted GCI, Q: Pre-split Deduction, R: Brokerage Split,
 * S: Admin Fees/Other Deductions, T: NCI, U: Status, V: Assistant Bonus, W: Buyer's Agent Split,
 * X: Transaction Type (NEW v3.5), Y: Referring Agent (NEW v3.5), Z: Referral Fee Received (NEW v3.5)
 * 
 * @version 3.5.0
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let gapiInited = false;

/**
 * Initialize the Google APIs
 */
export async function initialize() {
  console.log('🚀 Initializing Google Sheets (Fixed OAuth Flow)...');
  
  // Initialize GAPI
  await initializeGapiClient();
  
  // Check if returning from OAuth
  handleOAuthCallback();
  
  console.log('✅ Ready');
}

/**
 * Initialize GAPI client
 */
async function initializeGapiClient() {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    if (!window.gapi) {
      reject(new Error('Google API not loaded. Check internet connection.'));
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('✅ GAPI initialized');
        resolve();
      } catch (error) {
        console.error('❌ GAPI init error:', error);
        reject(error);
      }
    });
  });
}

/**
 * Handle OAuth callback
 */
function handleOAuthCallback() {
  const hash = window.location.hash;
  
  if (hash && hash.includes('access_token=')) {
    console.log('🔐 OAuth callback detected');
    
    // Parse token from URL hash
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in') || '3600';
    
    if (accessToken) {
      // Store token
      const expiryTime = Date.now() + (parseInt(expiresIn) * 1000);
      
      sessionStorage.setItem('google_access_token', accessToken);
      sessionStorage.setItem('google_token_expires', expiryTime.toString());
      
      // Set token in GAPI
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken({
          access_token: accessToken
        });
      }
      
      console.log('✅ Token stored successfully');
      
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Notify app
      window.dispatchEvent(new CustomEvent('googleAuthSuccess'));
      
      // Show success message
      alert('✅ Google Sheets connected successfully!');
    }
  } else {
    // Check for stored token
    const storedToken = sessionStorage.getItem('google_access_token');
    const tokenExpires = parseInt(sessionStorage.getItem('google_token_expires') || '0');
    
    if (storedToken && tokenExpires > Date.now()) {
      console.log('✅ Using stored token');
      
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken({
          access_token: storedToken
        });
      }
    }
  }
}

/**
 * Check if authenticated
 */
export function hasValidToken() {
  const tokenExpires = parseInt(sessionStorage.getItem('google_token_expires') || '0');
  const hasToken = sessionStorage.getItem('google_access_token') !== null;
  
  return hasToken && tokenExpires > Date.now();
}

/**
 * Sign in - Full page redirect (NO POPUP!)
 */
export function signIn() {
  console.log('🔐 Starting OAuth sign-in...');
  
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    alert('❌ Error: Google Client ID not configured. Please check your environment variables.');
    throw new Error('REACT_APP_GOOGLE_CLIENT_ID not found');
  }
  
  // Get current URL for redirect
  const redirectUri = window.location.origin + window.location.pathname;
  
  // Build OAuth URL for implicit flow
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token', // Implicit flow - returns token directly
    scope: SCOPES,
    include_granted_scopes: 'true',
    state: 'pass_through_value'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
  
  console.log('🔐 Redirecting to:', authUrl);
  console.log('📍 Redirect URI:', redirectUri);
  
  // Full page redirect (NO POPUP - NO COOP ISSUES!)
  window.location.href = authUrl;
  
  // Return promise (won't resolve on this page load)
  return new Promise((resolve) => {
    window.addEventListener('googleAuthSuccess', () => {
      resolve({ success: true });
    }, { once: true });
  });
}

/**
 * Sign out
 */
export function signOut() {
  const token = sessionStorage.getItem('google_access_token');
  
  // Revoke token
  if (token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST'
    }).catch(err => console.log('Token revocation failed:', err));
  }
  
  // Clear storage
  sessionStorage.removeItem('google_access_token');
  sessionStorage.removeItem('google_token_expires');
  
  // Clear GAPI token
  if (window.gapi && window.gapi.client) {
    window.gapi.client.setToken(null);
  }
  
  console.log('✅ Signed out');
}

/**
 * Helper function to parse currency/number strings from Google Sheets
 * Handles: "$1,234.56", "1234.56", "1,234", etc.
 */
function parseCurrency(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, spaces
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Read transactions from Google Sheets
 */
export async function readTransactions() {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please click "Enable Google Sheets Sync" to sign in.');
  }

  try {
    console.log('📊 Reading from Google Sheets...');
    
    const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }
    
    const range = 'Transactions!A2:Z';

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.result.values || [];
    console.log(`✅ Loaded ${rows.length} transactions`);

    return rows.map((row, index) => ({
      id: `sheet-${index + 1}`,
      propertyType: row[0] || 'Residential',
      clientType: row[1] || 'Seller',
      source: row[2] || '',
      address: row[3] || '',
      city: row[4] || '',
      state: 'CA', // Not in sheet, default to CA
      zip: '', // Not in sheet
      listPrice: parseCurrency(row[5]),
      commissionPct: parseCurrency(row[6]),
      listDate: row[7] || '',
      closingDate: row[8] || '',
      brokerage: row[9] || 'BDH', // J: Brokerage (BDH or KW)
      netVolume: parseCurrency(row[10]),
      closedPrice: parseCurrency(row[11]),
      gci: parseCurrency(row[12]),
      referralPct: parseCurrency(row[13]),
      referralDollar: parseCurrency(row[14]),
      adjustedGci: parseCurrency(row[15]),
      preSplitDeduction: parseCurrency(row[16]),
      totalBrokerageFees: parseCurrency(row[17]),
      companyDollar: parseCurrency(row[17]), // Using brokeragesplit
      otherDeductions: parseCurrency(row[18]),
      nci: parseCurrency(row[19]),
      status: row[20] || 'Closed',
      assistantBonus: parseCurrency(row[21]),
      buyersAgentSplit: parseCurrency(row[22]),
      transactionType: row[23] || 'Sale', // X: Transaction Type (NEW v3.5)
      referringAgent: row[24] || '', // Y: Referring Agent (NEW v3.5)
      referralFeeReceived: parseCurrency(row[25]), // Z: Referral Fee Received (NEW v3.5)
      notes: '',
    }));
  } catch (error) {
    console.error('❌ Read error:', error);
    
    if (error.status === 401 || error.status === 403) {
      // Token expired or invalid
      sessionStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_token_expires');
      throw new Error('Session expired. Please sign in again.');
    }
    
    throw error;
  }
}

/**
 * Write transactions to Google Sheets
 */
export async function writeTransactions(transactions) {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  try {
    console.log('💾 Writing to Google Sheets...');
    
    const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
    const range = 'Transactions!A2:Z';

    const rows = transactions.map(t => [
      t.propertyType || 'Residential',        // A: Property Type
      t.clientType || 'Seller',               // B: Client Type
      t.source || '',                         // C: Source
      t.address || '',                        // D: Address
      t.city || '',                           // E: City
      t.listPrice || 0,                       // F: List Price
      t.commissionPct || 0,                   // G: Commission %
      t.listDate || '',                       // H: List Date
      t.closingDate || '',                    // I: Closing Date
      t.brokerage || 'BDH',                   // J: Brokerage (BDH or KW)
      t.netVolume || 0,                       // K: Net Volume
      t.closedPrice || 0,                     // L: Closed Price
      t.gci || 0,                             // M: GCI
      t.referralPct || 0,                     // N: Referral %
      t.referralDollar || 0,                  // O: Referral Dollar
      t.adjustedGci || 0,                     // P: Adjusted GCI
      t.preSplitDeduction || 0,               // Q: Pre-split Deduction
      t.totalBrokerageFees || 0,              // R: Brokerage Split
      t.otherDeductions || 0,                 // S: Admin Fees/Other Deductions
      t.nci || 0,                             // T: NCI
      t.status || 'Closed',                   // U: Status
      t.assistantBonus || 0,                  // V: Assistant Bonus
      t.buyersAgentSplit || 0,                // W: Buyer's Agent Split
      t.transactionType || 'Sale',            // X: Transaction Type (NEW v3.5)
      t.referringAgent || '',                 // Y: Referring Agent (NEW v3.5)
      t.referralFeeReceived || 0,             // Z: Referral Fee Received (NEW v3.5)
    ]);

    // Clear existing data
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });

    // Write new data
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    console.log(`✅ Wrote ${rows.length} transactions`);
    return response;
  } catch (error) {
    console.error('❌ Write error:', error);
    
    if (error.status === 401 || error.status === 403) {
      sessionStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_token_expires');
      throw new Error('Session expired. Please sign in again.');
    }
    
    throw error;
  }
}

/**
 * Add single transaction
 */
export async function addTransaction(transaction) {
  const transactions = await readTransactions();
  transactions.push(transaction);
  await writeTransactions(transactions);
}

/**
 * Update single transaction
 */
export async function updateTransaction(transaction) {
  const transactions = await readTransactions();
  const index = transactions.findIndex(t => t.id === transaction.id);
  
  if (index !== -1) {
    transactions[index] = transaction;
    await writeTransactions(transactions);
  } else {
    await addTransaction(transaction);
  }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(transactionId) {
  const transactions = await readTransactions();
  const filtered = transactions.filter(t => t.id !== transactionId);
  await writeTransactions(filtered);
}

// Backward compatibility exports
export const initializeGoogleSheets = initialize;
export const isAuthorized = hasValidToken;
export const authorizeUser = signIn;
export const signOutUser = signOut;
export const readFromGoogleSheets = readTransactions;
export const writeToGoogleSheets = writeTransactions;
export const addToGoogleSheets = addTransaction;
export const updateInGoogleSheets = updateTransaction;
export const deleteFromGoogleSheets = deleteTransaction;

export default {
  initialize,
  hasValidToken,
  signIn,
  signOut,
  readTransactions,
  writeTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  initializeGoogleSheets,
  isAuthorized,
  authorizeUser,
  signOutUser,
  readFromGoogleSheets,
  writeToGoogleSheets,
  addToGoogleSheets,
  updateInGoogleSheets,
  deleteFromGoogleSheets,
};

