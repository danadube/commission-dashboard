/**
 * Google Sheets Service v1.3
 * Updated: October 25, 2025
 * 
 * CHANGES IN v1.3:
 * - Switched from OAuth popup to Google Identity Services (GIS)
 * - Uses modern "Sign In With Google" button
 * - No COOP/popup blocking issues
 * - Better UX with industry-standard sign-in
 * - More reliable authentication flow
 * 
 * This service handles all Google Sheets operations for the Real Estate Dashboard
 */

// Configuration
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || '1JN8qt64Jpy3PIxW9WDVmTNmDVdoHDhY0hJ4ZBVAmTnQ';
const SHEET_NAME = 'Transactions';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Scopes for Google Sheets access
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Column mapping (A-W = 23 columns)
const COLUMNS = {
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
  presplitDeduction: 'P',
  brokerageSplit: 'Q',
  adminFeesOtherDeductions: 'R',
  nci: 'S',
  status: 'T',
  assistantBonus: 'U',
  buyersAgentSplit: 'V',
  brokerage: 'W'
};

// State
let tokenClient = null;
let accessToken = null;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize Google API client
 */
async function initializeGapi() {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    try {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          gapiInited = true;
          console.log('✅ Google API client initialized');
          resolve();
        } catch (error) {
          console.error('❌ Error initializing GAPI client:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Error loading GAPI:', error);
      reject(error);
    }
  });
}

/**
 * Initialize Google Identity Services
 */
function initializeGis() {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set in requestAccessToken
      });
      gisInited = true;
      console.log('✅ Google Identity Services initialized');
      resolve();
    } catch (error) {
      console.error('❌ Error initializing GIS:', error);
      reject(error);
    }
  });
}

/**
 * Request access token from user
 */
function requestAccessToken(callback) {
  tokenClient.callback = async (response) => {
    if (response.error !== undefined) {
      console.error('❌ OAuth error:', response);
      callback(null, response.error);
      return;
    }
    
    accessToken = response.access_token;
    console.log('✅ Access token received');
    callback(accessToken, null);
  };

  if (accessToken === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and consent dialog for an existing session
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

/**
 * Check if user has valid access token
 */
function hasValidToken() {
  return accessToken !== null;
}

/**
 * Revoke access token (sign out)
 */
function revokeToken(callback) {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      console.log('✅ Access token revoked');
      callback();
    });
  } else {
    callback();
  }
}

/**
 * Initialize the Google Sheets service
 */
async function initialize() {
  try {
    console.log('🚀 Initializing Google Sheets Service v1.3...');
    
    // Wait for both gapi and gis to load
    await Promise.all([
      initializeGapi(),
      initializeGis()
    ]);
    
    console.log('✅ Google Sheets Service ready');
    return { success: true };
  } catch (error) {
    console.error('❌ Initialization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in with Google
 */
function signIn(callback) {
  requestAccessToken((token, error) => {
    if (error) {
      callback({ success: false, error });
    } else {
      callback({ success: true, token });
    }
  });
}

/**
 * Sign out from Google
 */
function signOut(callback) {
  revokeToken(() => {
    callback({ success: true });
  });
}

/**
 * Convert row data to transaction object
 */
function rowToTransaction(row, index) {
  if (!row || row.length === 0) return null;
  
  return {
    id: `txn-${index + 1}`,
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
    presplitDeduction: parseFloat(row[15]) || 0,
    brokerageSplit: parseFloat(row[16]) || 0,
    adminFeesOtherDeductions: parseFloat(row[17]) || 0,
    nci: parseFloat(row[18]) || 0,
    status: row[19] || '',
    assistantBonus: parseFloat(row[20]) || 0,
    buyersAgentSplit: parseFloat(row[21]) || 0,
    brokerage: row[22] || ''
  };
}

/**
 * Convert transaction object to row data
 */
function transactionToRow(transaction) {
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
    transaction.presplitDeduction || 0,
    transaction.brokerageSplit || 0,
    transaction.adminFeesOtherDeductions || 0,
    transaction.nci || 0,
    transaction.status || '',
    transaction.assistantBonus || 0,
    transaction.buyersAgentSplit || 0,
    transaction.brokerage || ''
  ];
}

/**
 * Read all transactions from Google Sheets
 */
async function readFromGoogleSheets() {
  if (!hasValidToken()) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:W`,
    });

    const rows = response.result.values || [];
    const transactions = rows
      .map((row, index) => rowToTransaction(row, index))
      .filter(t => t !== null);

    console.log(`✅ Read ${transactions.length} transactions from Google Sheets`);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('❌ Error reading from Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Write all transactions to Google Sheets
 */
async function writeToGoogleSheets(transactions) {
  if (!hasValidToken()) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Clear existing data (keep headers)
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:W`,
    });

    // Convert transactions to rows
    const rows = transactions.map(t => transactionToRow(t));

    // Write new data
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:W`,
      valueInputOption: 'RAW',
      resource: {
        values: rows,
      },
    });

    console.log(`✅ Wrote ${transactions.length} transactions to Google Sheets`);
    return { success: true, data: response.result };
  } catch (error) {
    console.error('❌ Error writing to Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Append a new transaction to Google Sheets
 */
async function appendToGoogleSheets(transaction) {
  if (!hasValidToken()) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const row = transactionToRow(transaction);
    
    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:W`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });

    console.log('✅ Appended transaction to Google Sheets');
    return { success: true, data: response.result };
  } catch (error) {
    console.error('❌ Error appending to Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a transaction in Google Sheets
 */
async function updateInGoogleSheets(transaction, rowIndex) {
  if (!hasValidToken()) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const row = transactionToRow(transaction);
    const range = `${SHEET_NAME}!A${rowIndex + 2}:W${rowIndex + 2}`;
    
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [row],
      },
    });

    console.log('✅ Updated transaction in Google Sheets');
    return { success: true, data: response.result };
  } catch (error) {
    console.error('❌ Error updating in Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a transaction from Google Sheets
 */
async function deleteFromGoogleSheets(rowIndex) {
  if (!hasValidToken()) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2,
            },
          },
        }],
      },
    });

    console.log('✅ Deleted transaction from Google Sheets');
    return { success: true, data: response.result };
  } catch (error) {
    console.error('❌ Error deleting from Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

// Export all functions
export {
  initialize,
  initialize as initializeGoogleSheets, // Export as both names
  signIn,
  signOut,
  hasValidToken,
  readFromGoogleSheets,
  writeToGoogleSheets,
  appendToGoogleSheets,
  updateInGoogleSheets,
  deleteFromGoogleSheets,
};

// Default export for backwards compatibility
export default {
  initialize,
  initializeGoogleSheets: initialize, // Alias
  signIn,
  signOut,
  hasValidToken,
  readFromGoogleSheets,
  writeToGoogleSheets,
  appendToGoogleSheets,
  updateInGoogleSheets,
  deleteFromGoogleSheets,
};
