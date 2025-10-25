/**
 * Google Sheets Integration Service
 * Version: 1.0
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
          console.log('âœ… Google API initialized');
          resolve();
        } catch (error) {
          console.error('âŒ Error initializing Google API:', error);
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Initialize Google Identity Services (OAuth)
 */
export const initGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        callback: '', // Will be set when requesting token
      });
      gisInited = true;
      console.log('âœ… Google Identity Services initialized');
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Request user authorization
 */
export const authorizeUser = () => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (response) => {
      if (response.error) {
        console.error('âŒ Authorization error:', response);
        reject(response);
      } else {
        console.log('âœ… User authorized');
        resolve(response);
      }
    };
    
    // Check if already authorized
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
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
    console.log('âœ… User signed out');
  }
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
      await authorizeUser();
    }
    
    console.log('ðŸ“Š Reading from Google Sheets...');
    
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetId,
      range: `${CONFIG.sheetName}!A2:W`, // Skip header row
    });
    
    const rows = response.result.values;
    
    if (!rows || rows.length === 0) {
      console.log('ðŸ“Š No data found in sheet');
      return [];
    }
    
    const transactions = rows
      .map((row, index) => rowToTransaction(row, index + 2)) // +2 for header and 0-index
      .filter(t => t !== null);
    
    console.log(`âœ… Loaded ${transactions.length} transactions from Google Sheets`);
    return transactions;
    
  } catch (error) {
    console.error('âŒ Error reading from Google Sheets:', error);
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
      await authorizeUser();
    }
    
    console.log('ðŸ“ Writing to Google Sheets...');
    
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
    
    console.log(`âœ… Wrote ${rows.length} transactions to Google Sheets`);
    return response;
    
  } catch (error) {
    console.error('âŒ Error writing to Google Sheets:', error);
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
      await authorizeUser();
    }
    
    console.log('âž• Appending transaction to Google Sheets...');
    
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
    
    console.log('âœ… Transaction appended to Google Sheets');
    return response;
    
  } catch (error) {
    console.error('âŒ Error appending to Google Sheets:', error);
    throw error;
  }
};

/**
 * Update spreadsheet configuration
 */
export const updateConfig = (newConfig) => {
  Object.assign(CONFIG, newConfig);
  console.log('âš™ï¸ Configuration updated:', CONFIG);
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
    console.log('ðŸš€ Initializing Google Sheets integration...');
    
    await initGoogleAPI();
    await initGoogleIdentity();
    
    console.log('âœ… Google Sheets integration ready');
    return true;
    
  } catch (error) {
    console.error('âŒ Failed to initialize Google Sheets:', error);
    throw error;
  }
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
