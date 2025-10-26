/**
 * Google Sheets Service - Version 2.0 (One Tap Auth - Backward Compatible)
 * Real Estate Commission Dashboard - Google Sheets Integration
 * Uses Google One Tap for authentication (no popups, no COOP issues)
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;

/**
 * Initialize the Google APIs
 */
export async function initialize() {
  console.log('🚀 Initializing Google Sheets integration (One Tap)...');
  
  // Initialize GAPI (Google API Client)
  await initializeGapiClient();
  
  // Initialize GIS (Google Identity Services) with One Tap
  await initializeGisClient();
  
  console.log('✅ Google Sheets integration ready');
}

/**
 * Initialize the Google API client
 */
async function initializeGapiClient() {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    if (!window.gapi) {
      reject(new Error('Google API not loaded'));
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('✅ Google API client initialized');
        resolve();
      } catch (error) {
        console.error('❌ Error initializing GAPI:', error);
        reject(error);
      }
    });
  });
}

/**
 * Initialize Google Identity Services with One Tap
 */
async function initializeGisClient() {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    try {
      // Create token client for programmatic access token requests
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set dynamically
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
 * Check if user has a valid access token
 */
export function hasValidToken() {
  return accessToken !== null && window.gapi?.client?.getToken() !== null;
}

/**
 * Sign in the user using One Tap or standard OAuth
 * Returns a promise that resolves when authentication is complete
 */
export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Services not initialized'));
      return;
    }

    try {
      console.log('🔐 Requesting access token...');
      
      // Set the callback for this specific request
      tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
          console.error('❌ OAuth error:', response);
          reject(new Error(response.error));
          return;
        }

        // Store the access token
        accessToken = response.access_token;
        console.log('✅ Access token received');
        resolve(response);
      };

      // Request the access token
      // This will show Google's account picker (One Tap style)
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('❌ Error during sign-in:', error);
      reject(error);
    }
  });
}

/**
 * Sign out the user
 */
export function signOut() {
  const token = window.gapi?.client?.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('✅ User signed out');
    });
    window.gapi.client.setToken(null);
  }
  accessToken = null;
}

/**
 * Read all transactions from Google Sheets
 */
export async function readTransactions() {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  try {
    console.log('📊 Reading from Google Sheets...');
    
    const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
    const range = 'Transactions!A2:O'; // Read from row 2 to skip headers

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.result.values || [];
    console.log(`✅ Loaded ${rows.length} transactions from Google Sheets`);

    // Convert rows to transaction objects
    const transactions = rows.map((row, index) => ({
      id: row[0] || `sheet-${index + 1}`,
      date: row[1] || '',
      address: row[2] || '',
      city: row[3] || '',
      state: row[4] || 'CA',
      zip: row[5] || '',
      type: row[6] || 'Listing',
      status: row[7] || 'Closed',
      salePrice: parseFloat(row[8]) || 0,
      brokerage: row[9] || 'KW',
      grossCommission: parseFloat(row[10]) || 0,
      companyDollar: parseFloat(row[11]) || 0,
      netCommission: parseFloat(row[12]) || 0,
      notes: row[13] || '',
      archived: row[14] === 'TRUE' || row[14] === 'true',
    }));

    return transactions;
  } catch (error) {
    console.error('❌ Error reading from Google Sheets:', error);
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
    const range = 'Transactions!A2:O';

    // Convert transactions to rows
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.address,
      t.city,
      t.state,
      t.zip,
      t.type,
      t.status,
      t.salePrice,
      t.brokerage,
      t.grossCommission,
      t.companyDollar,
      t.netCommission,
      t.notes,
      t.archived ? 'TRUE' : 'FALSE',
    ]);

    // Clear existing data first
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    // Write new data
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
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
}

/**
 * Add a single transaction to Google Sheets
 */
export async function addTransaction(transaction) {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  try {
    const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
    const range = 'Transactions!A2:O';

    const row = [
      transaction.id,
      transaction.date,
      transaction.address,
      transaction.city,
      transaction.state,
      transaction.zip,
      transaction.type,
      transaction.status,
      transaction.salePrice,
      transaction.brokerage,
      transaction.grossCommission,
      transaction.companyDollar,
      transaction.netCommission,
      transaction.notes,
      transaction.archived ? 'TRUE' : 'FALSE',
    ];

    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row],
      },
    });

    console.log('✅ Added transaction to Google Sheets');
  } catch (error) {
    console.error('❌ Error adding transaction:', error);
    throw error;
  }
}

/**
 * Update a transaction in Google Sheets
 */
export async function updateTransaction(transaction) {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  try {
    // For simplicity, we'll reload all transactions, update the one we need, and write back
    const transactions = await readTransactions();
    const index = transactions.findIndex(t => t.id === transaction.id);
    
    if (index !== -1) {
      transactions[index] = transaction;
      await writeTransactions(transactions);
      console.log('✅ Updated transaction in Google Sheets');
    } else {
      console.warn('⚠️ Transaction not found, adding as new');
      await addTransaction(transaction);
    }
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction from Google Sheets
 */
export async function deleteTransaction(transactionId) {
  if (!hasValidToken()) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  try {
    const transactions = await readTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== transactionId);
    await writeTransactions(filteredTransactions);
    console.log('✅ Deleted transaction from Google Sheets');
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    throw error;
  }
}

// BACKWARD COMPATIBILITY: Export all functions with old names as aliases
export const initializeGoogleSheets = initialize;
export const isAuthorized = hasValidToken;
export const authorizeUser = signIn;
export const signOutUser = signOut;
export const readFromGoogleSheets = readTransactions;
export const writeToGoogleSheets = writeTransactions;
export const addToGoogleSheets = addTransaction;
export const updateInGoogleSheets = updateTransaction;
export const deleteFromGoogleSheets = deleteTransaction;

// Default export with both old and new names
export default {
  // New names
  initialize,
  hasValidToken,
  signIn,
  signOut,
  readTransactions,
  writeTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  
  // Old names (backward compatibility)
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
