/**
 * Google Sheets Integration Service
 * Version: 1.1 - Fixed for Vercel COOP policy
 * 
 * Handles all Google Sheets API interactions for the Real Estate Dashboard
 * Two-way sync: Read from and Write to Google Sheets
 * 
 * CHANGELOG v1.1:
 * - Changed OAuth flow from popup to redirect (fixes COOP blocking)
 * - Added ux_mode: 'redirect' to prevent popup issues
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

// ==================== STATE ====================

let gapiInited = false;
let gisInited = false;
let tokenClient = null;

// ==================== INITIALIZATION ====================

/**
 * Initialize Google API Client
 */
export const initGoogleApi = () => {
  return new Promise((resolve, reject) => {
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
    document.body.appendChild(script);
  });
};

/**
 * Initialize Google Identity Services (OAuth) - REDIRECT MODE
 */
export const initGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        ux_mode: 'redirect', // ⭐ FIX: Use redirect instead of popup
        redirect_uri: window.location.origin, // Current URL
        callback: '', // Will be set when requesting token
      });
      gisInited = true;
      console.log('✅ Google Identity Services initialized (redirect mode)');
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Request user authorization - REDIRECT FLOW
 */
export const authorizeUser = () => {
  return new Promise((resolve, reject) => {
    // Store current location for redirect back
    sessionStorage.setItem('oauth_redirect_origin', window.location.href);
    
    tokenClient.callback = async (response) => {
      if (response.error) {
        console.error('❌ Authorization error:', response);
        reject(response);
      } else {
        console.log('✅ User authorized');
        // Store token
        window.gapi.client.setToken(response);
        resolve(response);
      }
    };
    
    // Check if already authorized
    if (window.gapi.client.getToken() === null) {
      // Request access token - will redirect to Google
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Already authorized, just resolve
      resolve(window.gapi.client.getToken());
    }
  });
};

/**
 * Handle OAuth redirect callback
 * Call this on page load to process returning OAuth redirect
 */
export const handleOAuthCallback = () => {
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    // Parse the access token from URL hash
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      console.log('✅ OAuth callback received');
      // Set the token
      window.gapi.client.setToken({
        access_token: accessToken
      });
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Get original location
      const redirectOrigin = sessionStorage.getItem('oauth_redirect_origin');
      if (redirectOrigin) {
        sessionStorage.removeItem('oauth_redirect_origin');
      }
      
      return true;
    }
  }
  return false;
};

/**
 * Check if user is currently authorized
 */
export const isAuthorized = () => {
  return window.gapi?.client?.getToken() !== null;
};

/**
 * Sign out user
 */
export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
    console.log('✅ User signed out');
  }
};

// ==================== GOOGLE SHEETS OPERATIONS ====================

/**
 * Load all transactions from Google Sheets
 */
export const loadTransactions = async () => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`, // All data rows (skip header)
    });

    const rows = response.result.values || [];
    console.log(`✅ Loaded ${rows.length} transactions from Google Sheets`);
    
    // Convert rows to transaction objects
    const transactions = rows.map((row, index) => ({
      id: `gsheet-${index + 2}`, // Row number as ID (starting from row 2)
      propertyType: row[0] || '',
      clientType: row[1] || '',
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
      adjustedGci2: parseFloat(row[22]) || 0,
    }));

    return transactions;
  } catch (error) {
    console.error('❌ Error loading transactions:', error);
    throw error;
  }
};

/**
 * Save a single transaction to Google Sheets (append new row)
 */
export const saveTransaction = async (transaction) => {
  try {
    // Convert transaction object to array (matching column order A-W)
    const row = [
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
      transaction.adjustedGci2 || 0,
    ];

    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`, // Append after last row
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row],
      },
    });

    console.log('✅ Transaction saved to Google Sheets');
    return response;
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    throw error;
  }
};

/**
 * Update an existing transaction in Google Sheets
 */
export const updateTransaction = async (transaction, rowNumber) => {
  try {
    // Convert transaction object to array
    const row = [
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
      transaction.adjustedGci2 || 0,
    ];

    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A${rowNumber}:W${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row],
      },
    });

    console.log(`✅ Transaction updated in row ${rowNumber}`);
    return response;
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
};

/**
 * Delete a transaction from Google Sheets
 */
export const deleteTransaction = async (rowNumber) => {
  try {
    // Clear the row (Google Sheets doesn't have a direct delete row API)
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A${rowNumber}:W${rowNumber}`,
    });

    console.log(`✅ Transaction deleted from row ${rowNumber}`);
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    throw error;
  }
};

/**
 * Sync all transactions from dashboard to Google Sheets
 * Clears existing data and writes all transactions
 */
export const syncToGoogleSheets = async (transactions) => {
  try {
    // Convert transactions to rows
    const rows = transactions.map(t => [
      t.propertyType || '',
      t.clientType || '',
      t.source || '',
      t.address || '',
      t.city || '',
      t.listPrice || 0,
      t.commissionPct || 0,
      t.listDate || '',
      t.closingDate || '',
      t.netVolume || 0,
      t.closedPrice || 0,
      t.gci || 0,
      t.referralPct || 0,
      t.referralDollar || 0,
      t.adjustedGci || 0,
      t.preSplitDeduction || 0,
      t.brokerageSplit || 0,
      t.adminFeesOther || 0,
      t.nci || 0,
      t.status || 'Closed',
      t.assistantBonus || 0,
      t.buyersAgentSplit || 0,
      t.adjustedGci2 || 0,
    ]);

    // Clear existing data (except header)
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`,
    });

    // Write all transactions
    if (rows.length > 0) {
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: CONFIG.spreadsheetId,
        range: `${CONFIG.sheetName}!A2:W`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: rows,
        },
      });
    }

    console.log(`✅ Synced ${rows.length} transactions to Google Sheets`);
    return rows.length;
  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error);
    throw error;
  }
};

/**
 * Initialize the entire Google Sheets integration
 */
export const initialize = async () => {
  try {
    console.log('🚀 Initializing Google Sheets integration...');
    await initGoogleApi();
    await initGoogleIdentity();
    
    // Check if returning from OAuth redirect
    const hadCallback = handleOAuthCallback();
    if (hadCallback) {
      console.log('✅ Processed OAuth callback');
    }
    
    console.log('✅ Google Sheets integration ready');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets:', error);
    throw error;
  }
};

export default {
  initialize,
  authorizeUser,
  handleOAuthCallback,
  isAuthorized,
  signOut,
  loadTransactions,
  saveTransaction,
  updateTransaction,
  deleteTransaction,
  syncToGoogleSheets,
};
