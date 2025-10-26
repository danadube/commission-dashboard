/**
 * Google Sheets Service - Version 2.2 (Manual Redirect - NO POPUPS!)
 * Real Estate Commission Dashboard - Google Sheets Integration
 * Uses manual OAuth redirect (bypasses tokenClient completely)
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let gapiInited = false;

/**
 * Initialize the Google APIs
 */
export async function initialize() {
  console.log('🚀 Initializing Google Sheets integration (Manual Redirect)...');
  
  // Initialize GAPI (Google API Client)
  await initializeGapiClient();
  
  // Check if we're returning from OAuth redirect
  handleOAuthCallback();
  
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
 * Handle OAuth callback after redirect
 */
function handleOAuthCallback() {
  // Check if we have an access token in the URL hash
  const hash = window.location.hash;
  if (hash && hash.includes('access_token=')) {
    console.log('🔐 Processing OAuth callback...');
    
    // Parse the hash to extract the token
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (accessToken) {
      // Set the token in gapi
      window.gapi.client.setToken({
        access_token: accessToken,
        expires_in: parseInt(expiresIn || '3600'),
      });
      
      // Store in session storage for persistence
      sessionStorage.setItem('google_access_token', accessToken);
      sessionStorage.setItem('google_token_expires', Date.now() + parseInt(expiresIn || '3600') * 1000);
      
      console.log('✅ Access token received and stored');
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Trigger a custom event to notify the app
      window.dispatchEvent(new CustomEvent('googleAuthSuccess'));
    }
  } else {
    // Check if we have a stored token
    const storedToken = sessionStorage.getItem('google_access_token');
    const tokenExpires = parseInt(sessionStorage.getItem('google_token_expires') || '0');
    
    if (storedToken && tokenExpires > Date.now()) {
      console.log('✅ Using stored access token');
      window.gapi.client.setToken({
        access_token: storedToken,
      });
    }
  }
}

/**
 * Check if user has a valid access token
 */
export function hasValidToken() {
  const token = window.gapi?.client?.getToken();
  if (token && token.access_token) {
    // Check if stored token is still valid
    const tokenExpires = parseInt(sessionStorage.getItem('google_token_expires') || '0');
    return tokenExpires > Date.now();
  }
  return false;
}

/**
 * Sign in the user using MANUAL redirect (NO tokenClient, NO popups!)
 */
export function signIn() {
  console.log('🔐 Building OAuth redirect URL...');
  
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = SCOPES;
  
  // Build OAuth URL manually
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', 'pass-through-value');
  
  console.log('🔐 Redirecting to Google sign-in...');
  console.log('📍 Redirect URI:', redirectUri);
  
  // Save current state before redirect
  sessionStorage.setItem('preAuthPath', window.location.pathname);
  
  // Manually redirect (NO POPUPS!)
  window.location.href = authUrl.toString();
  
  // Return a promise (though we're redirecting, so this won't resolve in this page load)
  return new Promise((resolve) => {
    // Listen for auth success event after redirect
    window.addEventListener('googleAuthSuccess', () => {
      resolve({ success: true });
    }, { once: true });
  });
}

/**
 * Sign out the user
 */
export function signOut() {
  const token = window.gapi?.client?.getToken();
  if (token?.access_token) {
    // Revoke the token
    fetch(`https://oauth2.googleapis.com/revoke?token=${token.access_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(() => {
      console.log('✅ Token revoked');
    }).catch(err => {
      console.log('⚠️ Token revocation failed:', err);
    });
  }
  
  // Clear stored tokens
  sessionStorage.removeItem('google_access_token');
  sessionStorage.removeItem('google_token_expires');
  sessionStorage.removeItem('preAuthPath');
  
  // Clear gapi token
  window.gapi?.client?.setToken(null);
  
  console.log('✅ Session cleared');
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
    const range = 'Transactions!A2:O';

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.result.values || [];
    console.log(`✅ Loaded ${rows.length} transactions from Google Sheets`);

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

    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: range,
    });

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

// BACKWARD COMPATIBILITY: Export with old function names
export const initializeGoogleSheets = initialize;
export const isAuthorized = hasValidToken;
export const authorizeUser = signIn;
export const signOutUser = signOut;
export const readFromGoogleSheets = readTransactions;
export const writeToGoogleSheets = writeTransactions;
export const addToGoogleSheets = addTransaction;
export const updateInGoogleSheets = updateTransaction;
export const deleteFromGoogleSheets = deleteTransaction;

// Default export
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
