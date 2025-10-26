/**
 * Google Sheets Integration Service
 * Version: 1.6 - SIMPLE TOKEN FLOW (Works with COOP removed)
 * 
 * CHANGES IN v1.6:
 * - Back to simple token client approach
 * - Works when COOP headers are configured properly
 * - Clean, straightforward implementation
 * - No complex redirect logic
 * 
 * Requires: vercel.json with COOP headers configured
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
  sheetName: 'Transactions',
  
  // Google API Settings
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
};

// Column mapping (A-W = 23 columns)
const COLUMN_MAPPING = {
  propertyType: 'A', clientType: 'B', source: 'C', address: 'D', city: 'E',
  listPrice: 'F', commissionPct: 'G', listDate: 'H', closingDate: 'I',
  netVolume: 'J', closedPrice: 'K', gci: 'L', referralPct: 'M',
  referralDollar: 'N', adjustedGci: 'O', preSplitDeduction: 'P',
  brokerageSplit: 'Q', adminFeesOther: 'R', nci: 'S', status: 'T',
  assistantBonus: 'U', buyersAgentSplit: 'V', adjustedGci2: 'W'
};

// ==================== STATE ====================

let gapiInited = false;
let gisInited = false;
let tokenClient = null;

// ==================== INITIALIZATION ====================

/**
 * Initialize Google API
 */
export const initGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }
    
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
  });
};

/**
 * Initialize Google Identity Services
 */
export const initGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }
    
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        callback: '', // Set dynamically when requesting token
      });
      gisInited = true;
      console.log('✅ Google Identity Services initialized');
      resolve();
    } catch (error) {
      console.error('❌ Error initializing Google Identity:', error);
      reject(error);
    }
  });
};

/**
 * Request user authorization
 */
export const authorizeUser = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }
    
    tokenClient.callback = async (response) => {
      if (response.error) {
        console.error('❌ Authorization error:', response);
        reject(response);
      } else {
        console.log('✅ User authorized');
        sessionStorage.setItem('google_access_token', response.access_token);
        resolve(response);
      }
    };
    
    // Check if already has token
    const token = window.gapi.client.getToken();
    if (token === null) {
      // First time - show consent
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Has token - skip consent
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

/**
 * Check if user is authorized
 */
export const isAuthorized = () => {
  const token = window.gapi?.client?.getToken();
  if (token && token.access_token) return true;
  
  const stored = sessionStorage.getItem('google_access_token');
  if (stored && window.gapi?.client) {
    window.gapi.client.setToken({ access_token: stored });
    return true;
  }
  
  return false;
};

/**
 * Sign out
 */
export const signOut = () => {
  const token = window.gapi?.client?.getToken();
  if (token?.access_token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
  sessionStorage.removeItem('google_access_token');
  console.log('✅ User signed out');
};

// ==================== DATA TRANSFORMATION ====================

const rowToTransaction = (row, index) => {
  if (!row || row.length === 0) return null;
  return {
    id: `sheet-${index}`,
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
    brokerage: row[1]?.includes('KW') ? 'KW' : 'BDH',
  };
};

const transactionToRow = (transaction) => [
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
  transaction.adjustedGci || 0,
];

// ==================== SHEETS OPERATIONS ====================

export const readFromGoogleSheets = async () => {
  if (!gapiInited) throw new Error('Google API not initialized');
  if (!isAuthorized()) throw new Error('Not authorized');
  
  console.log('📊 Reading from Google Sheets...');
  
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.spreadsheetId,
    range: `${CONFIG.sheetName}!A2:W`,
  });
  
  const rows = response.result.values;
  if (!rows || rows.length === 0) {
    console.log('📊 No data found');
    return [];
  }
  
  const transactions = rows
    .map((row, i) => rowToTransaction(row, i + 2))
    .filter(t => t !== null);
  
  console.log(`✅ Loaded ${transactions.length} transactions`);
  return transactions;
};

export const writeToGoogleSheets = async (transactions) => {
  if (!gapiInited) throw new Error('Google API not initialized');
  if (!isAuthorized()) throw new Error('Not authorized');
  
  console.log('📝 Writing to Google Sheets...');
  
  const rows = transactions.map(transactionToRow);
  
  await window.gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId: CONFIG.spreadsheetId,
    range: `${CONFIG.sheetName}!A2:W`,
  });
  
  const response = await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: CONFIG.spreadsheetId,
    range: `${CONFIG.sheetName}!A2:W`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rows },
  });
  
  console.log(`✅ Wrote ${rows.length} transactions`);
  return response;
};

export const appendTransaction = async (transaction) => {
  if (!gapiInited) throw new Error('Google API not initialized');
  if (!isAuthorized()) throw new Error('Not authorized');
  
  console.log('➕ Appending transaction...');
  
  const row = transactionToRow(transaction);
  
  const response = await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: CONFIG.spreadsheetId,
    range: `${CONFIG.sheetName}!A:W`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] },
  });
  
  console.log('✅ Transaction appended');
  return response;
};

export const updateConfig = (newConfig) => {
  Object.assign(CONFIG, newConfig);
  console.log('⚙️ Config updated');
};

export const getConfig = () => ({ ...CONFIG });

// ==================== MAIN INIT ====================

export const initializeGoogleSheets = async () => {
  console.log('🚀 Initializing Google Sheets integration...');
  
  await initGoogleAPI();
  await initGoogleIdentity();
  
  if (isAuthorized()) {
    console.log('✅ Ready (already authorized)');
  } else {
    console.log('✅ Ready (authorization needed)');
  }
  
  return true;
};

export default {
  initializeGoogleSheets,
  readFromGoogleSheets,
  writeToGoogleSheets,
  appendTransaction,
  authorizeUser,
  isAuthorized,
  signOut,
  updateConfig,
  getConfig,
};
