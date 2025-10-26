/**
 * Vercel Serverless Function - Google OAuth Handler
 * 
 * ⚠️ NOTE: This file is currently NOT IN USE
 * 
 * The dashboard uses client-side OAuth (Implicit Flow) via googleSheetsService.js
 * This serverless function is kept as a backup for potential future server-side OAuth implementation.
 * 
 * Current OAuth Flow:
 * - Client-side full-page redirect to Google OAuth
 * - Token stored in localStorage
 * - See: src/googleSheetsService.js for active implementation
 * 
 * To activate this (if needed in future):
 * 1. Add GOOGLE_CLIENT_SECRET to Vercel environment variables
 * 2. Update googleSheetsService.js to use this endpoint
 * 3. Change OAuth flow from Implicit to Authorization Code
 */

const { google } = require('googleapis');

// CORS headers for frontend communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  const { action, code, tokens } = req.query;

  // OAuth2 configuration
  const oauth2Client = new google.auth.OAuth2(
    process.env.REACT_APP_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET, // You'll need to add this
    `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/google?action=callback`
  );

  try {
    // Step 1: Generate authorization URL
    if (action === 'authorize') {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
        prompt: 'consent',
      });

      return res.status(200).json({
        ...corsHeaders,
        success: true,
        authUrl,
      });
    }

    // Step 2: Handle OAuth callback
    if (action === 'callback' && code) {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Redirect back to app with tokens
      const redirectUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/#access_token=${tokens.access_token}&expires_in=${tokens.expiry_date}`;
      return res.redirect(redirectUrl);
    }

    // Step 3: Refresh token
    if (action === 'refresh' && tokens) {
      oauth2Client.setCredentials(JSON.parse(tokens));
      const { credentials } = await oauth2Client.refreshAccessToken();

      return res.status(200).json({
        ...corsHeaders,
        success: true,
        tokens: credentials,
      });
    }

    return res.status(400).json({
      ...corsHeaders,
      success: false,
      error: 'Invalid action',
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({
      ...corsHeaders,
      success: false,
      error: error.message,
    });
  }
}

