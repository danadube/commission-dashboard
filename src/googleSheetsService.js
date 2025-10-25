/**
 * Google Sheets Integration Service
 * Version: 1.4 - REDIRECT OAUTH FIX
 * 
 * CHANGES IN v1.4:
 * - Switched from popup-based OAuth to redirect-based OAuth
 * - Fixes COOP (Cross-Origin-Opener-Policy) blocking issue on Vercel
 * - No more hanging OAuth popup!
 * 
 * Handles all Google Sheets API interactions for the Real Estate Dashboard
 * Two-way sync: Read from and Write to Google Sheets
 */

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Google API Configuration
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  
  // Google Sheets Configuration
  spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID || '',
  sheetName: 'Transactions', // Name of the sheet tab
  
  // Google API Settings
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
  
  // OAuth Redirect URL (current page)
  redirectUri: window.location.origin + window.location.pathname,
};

// Column mapping (A-W = 23 columns matching Excel structure)
const COLUMN_MAPPING = {
  propertyType: 'A',
  clientType: 'B',
  source: 'C',
  address: 'D',
  city: 'E',
  listPrice: 'F',
  commissionPct: 'G',
  listDate: 'H',
  closingDate: 'I',
  netVolume: 'J',
  closedPrice: 'K',
  gci: 'L',
  referralPct: 'M',
  referralDollar: 'N',
  adjustedGci: 'O',
  preSplitDeduction: 'P',
  brokerageSplit: 'Q',
  adminFeesOther: 'R',
  nci: 'S',
  status: 'T',
  assistantBonus: 'U',
  buyersAgentSplit: 'V',
  adjustedGci2: 'W' // Duplicate column in Excel
};

// ==================== GOOGLE API INITIALIZATION ====================

let gapiInited = false;
let gisInited = false;
let tokenClient;

/**
 * Initialize Google API
 */
export const initGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.gapi && gapiInited) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: CONFIG.apiKey,
            discoveryDocs: CONFIG.discoveryDocs,
          });
          gapiInited = true;
          console.log('✅ Google API initialized');
          resolve();
        } catch (error) {
          console.error('❌ Error initializing Google API:', error);
          reject(error);
        }
      });
    };
    script.onerror = reject;
    
    // Only add if not already present
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      document.body.appendChild(script);
    }
  });
};

/**
 * Initialize Google Identity Services (OAuth) - REDIRECT MODE
 */
export const initGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts?.oauth2 && gisInited) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      // Initialize token client with REDIRECT mode (ux_mode: 'redirect')
      tokenClient = window.google.accounts.oauth2.initCodeClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        ux_mode: 'redirect', // ✅ KEY CHANGE: redirect instead of popup
        redirect_uri: CONFIG.redirectUri,
      });
      gisInited = true;
      console.log('✅ Google Identity Services initialized (REDIRECT mode)');
      resolve();
    };
    script.onerror = reject;
    
    // Only add if not already present
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      document.body.appendChild(script);
    }
  });
};

/**
 * Handle OAuth callback after redirect
 * Call this on page load to check for OAuth response
 */
export const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('❌ OAuth error:', error);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(error);
  }
  
  if (code) {
    console.log('🔄 Processing OAuth callback...');
    
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: CONFIG.clientId,
          redirect_uri: CONFIG.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.access_token) {
        // Set the access token in gapi
        window.gapi.client.setToken({
          access_token: tokens.access_token,
        });
        
        // Store token in sessionStorage for persistence
        sessionStorage.setItem('google_access_token', tokens.access_token);
        if (tokens.refresh_token) {
          sessionStorage.setItem('google_refresh_token', tokens.refresh_token);
        }
        
        console.log('✅ OAuth successful, access token set');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('❌ Error exchanging code for token:', error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      throw error;
    }
  }
  
  // Check if we have a stored token
  const storedToken = sessionStorage.getItem('google_access_token');
  if (storedToken && window.gapi?.client) {
    window.gapi.client.setToken({
      access_token: storedToken,
    });
    console.log('✅ Restored access token from session');
    return true;
  }
  
  return false;
};

/**
 * Request user authorization - REDIRECT MODE
 */
export const authorizeUser = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔐 Starting OAuth redirect flow...');
      
      // Save current state before redirect
      sessionStorage.setItem('oauth_pending', 'true');
      
      // Request authorization code (will redirect to Google)
      tokenClient.requestCode();
      
      // Note: User will be redirected away, so this promise won't resolve here
      // It will resolve when they return via handleOAuthCallback()
      
    } catch (error) {
      console.error('❌ Error starting authorization:', error);
      sessionStorage.removeItem('oauth_pending');
      reject(error);
    }
  });
};

/**
 * Check if user is currently authorized
 */
export const isAuthorized = () => {
  // Check if gapi has a valid token
  const gapiToken = window.gapi?.client?.getToken();
  if (gapiToken && gapiToken.access_token) {
    return true;
  }
  
  // Check sessionStorage
  const storedToken = sessionStorage.getItem('google_access_token');
  if (storedToken) {
    // Restore token to gapi
    if (window.gapi?.client) {
      window.gapi.client.setToken({
        access_token: storedToken,
      });
    }
    return true;
  }
  
  return false;
};

/**
 * Sign out user
 */
export const signOut = () => {
  const token = window.gapi?.client?.getToken();
  if (token && token.access_token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('✅ Token revoked');
    });
    window.gapi.client.setToken('');
  }
  
  // Clear stored tokens
  sessionStorage.removeItem('google_access_token');
  sessionStorage.removeItem('google_refresh_token');
  sessionStorage.removeItem('oauth_pending');
  
  console.log('✅ User signed out');
};

// ==================== DATA TRANSFORMATION ====================

/**
 * Convert sheet row to transaction object
 */
const rowToTransaction = (row, rowIndex) => {
  if (!row || row.length === 0) return null;
  
  return {
    id: `sheet-${rowIndex}`,
    propertyType: row[0] || 'Residential',
    clientType: row[1] || 'Seller',
    source: row[2] || '',
    address: row[3] || '',
    city: row[4] || '',
    listPrice: parseFloat(row[5]) || 0,
    commissionPct: parseFloat(row[6]) || 0,
    listDate: row[7] || '',
    closingDate: row[8] || '',
    netVolume: parseFloat(row[9]) || 0,
    closedPrice: parseFloat(row[10]) || 0,
    gci: parseFloat(row[11]) || 0,
    referralPct: parseFloat(row[12]) || 0,
    referralDollar: parseFloat(row[13]) || 0,
    adjustedGci: parseFloat(row[14]) || 0,
    preSplitDeduction: parseFloat(row[15]) || 0,
    brokerageSplit: parseFloat(row[16]) || 0,
    adminFeesOther: parseFloat(row[17]) || 0,
    nci: parseFloat(row[18]) || 0,
    status: row[19] || 'Closed',
    assistantBonus: parseFloat(row[20]) || 0,
    buyersAgentSplit: parseFloat(row[21]) || 0,
    // Row 22 is duplicate adjustedGci
    brokerage: row[1]?.includes('KW') ? 'KW' : 'BDH', // Infer from data
  };
};

/**
 * Convert transaction object to sheet row
 */
const transactionToRow = (transaction) => {
  return [
    transaction.propertyType || '',
    transaction.clientType || '',
    transaction.source || '',
    transaction.address || '',
    transaction.city || '',
    transaction.listPrice || 0,
    transaction.commissionPct || 0,
    transaction.listDate || '',
    transaction.closingDate || '',
    transaction.netVolume || 0,
    transaction.closedPrice || 0,
    transaction.gci || 0,
    transaction.referralPct || 0,
    transaction.referralDollar || 0,
    transaction.adjustedGci || 0,
    transaction.preSplitDeduction || 0,
    transaction.brokerageSplit || 0,
    transaction.adminFeesOther || 0,
    transaction.nci || 0,
    transaction.status || 'Closed',
    transaction.assistantBonus || 0,
    transaction.buyersAgentSplit || 0,
    transaction.adjustedGci || 0, // Duplicate column
  ];
};

// ==================== GOOGLE SHEETS API OPERATIONS ====================

/**
 * Read all transactions from Google Sheets
 */
export const readFromGoogleSheets = async () => {
  try {
    if (!gapiInited) {
      throw new Error('Google API not initialized');
    }
    
    if (!isAuthorized()) {
      throw new Error('Not authorized - please sign in first');
    }
    
    console.log('📊 Reading from Google Sheets...');
    
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`, // Skip header row
    });
    
    const rows = response.result.values;
    
    if (!rows || rows.length === 0) {
      console.log('📊 No data found in sheet');
      return [];
    }
    
    const transactions = rows
      .map((row, index) => rowToTransaction(row, index + 2)) // +2 for header and 0-index
      .filter(t => t !== null);
    
    console.log(`✅ Loaded ${transactions.length} transactions from Google Sheets`);
    return transactions;
    
  } catch (error) {
    console.error('❌ Error reading from Google Sheets:', error);
    throw error;
  }
};

/**
 * Write all transactions to Google Sheets
 */
export const writeToGoogleSheets = async (transactions) => {
  try {
    if (!gapiInited) {
      throw new Error('Google API not initialized');
    }
    
    if (!isAuthorized()) {
      throw new Error('Not authorized - please sign in first');
    }
    
    console.log('📝 Writing to Google Sheets...');
    
    // Convert transactions to rows
    const rows = transactions.map(transactionToRow);
    
    // Clear existing data (except header)
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`,
    });
    
    // Write new data
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });
    
    console.log(`✅ Wrote ${rows.length} transactions to Google Sheets`);
    return response;
    
  } catch (error) {
    console.error('❌ Error writing to Google Sheets:', error);
    throw error;
  }
};

/**
 * Append a single transaction to Google Sheets
 */
export const appendTransaction = async (transaction) => {
  try {
    if (!gapiInited) {
      throw new Error('Google API not initialized');
    }
    
    if (!isAuthorized()) {
      throw new Error('Not authorized - please sign in first');
    }
    
    console.log('➕ Appending transaction to Google Sheets...');
    
    const row = transactionToRow(transaction);
    
    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A:W`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });
    
    console.log('✅ Transaction appended to Google Sheets');
    return response;
    
  } catch (error) {
    console.error('❌ Error appending to Google Sheets:', error);
    throw error;
  }
};

/**
 * Update spreadsheet configuration
 */
export const updateConfig = (newConfig) => {
  Object.assign(CONFIG, newConfig);
  console.log('⚙️ Configuration updated:', CONFIG);
};

/**
 * Get current configuration
 */
export const getConfig = () => {
  return { ...CONFIG };
};

// ==================== INITIALIZATION HELPER ====================

/**
 * Initialize everything at once
 */
export const initializeGoogleSheets = async () => {
  try {
    console.log('🚀 Initializing Google Sheets integration (REDIRECT mode)...');
    
    await initGoogleAPI();
    await initGoogleIdentity();
    
    // Check if we're returning from OAuth redirect
    const wasAuthorized = await handleOAuthCallback();
    
    if (wasAuthorized) {
      console.log('✅ Google Sheets integration ready (already authorized)');
    } else {
      console.log('✅ Google Sheets integration ready (not yet authorized)');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets:', error);
    throw error;
  }
};

export default {
  initializeGoogleSheets,
  handleOAuthCallback,
  readFromGoogleSheets,
  writeToGoogleSheets,
  appendTransaction,
  authorizeUser,
  isAuthorized,
  signOut,
  updateConfig,
  getConfig,
};
