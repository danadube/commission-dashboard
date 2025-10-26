# 🧪 OAuth Testing Guide

Quick test to verify Google Sheets OAuth is working correctly.

---

## 🚀 QUICK TEST (30 seconds)

### Test 1: Check Environment Variables

Open browser console on your deployed site:

```javascript
// Paste this in browser console (F12 → Console tab)
console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Spreadsheet ID:', process.env.REACT_APP_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');
```

**Expected**: All three should show ✅ Set

---

### Test 2: Check Google API Loading

```javascript
// Paste this in browser console
console.log('Google API loaded:', typeof window.gapi !== 'undefined' ? '✅ Yes' : '❌ No');
```

**Expected**: ✅ Yes

---

### Test 3: Full Authentication Flow

1. **Go to**: https://janice-dashboard.vercel.app
2. **Open Console**: Press F12, go to Console tab
3. **Click**: "Enable Google Sheets Sync" button
4. **Watch console**: Should see:
   ```
   🚀 Initializing Google Sheets (Fixed OAuth Flow)...
   ✅ GAPI initialized
   ✅ Ready
   🔐 Starting OAuth sign-in...
   🔐 Redirecting to: https://accounts.google.com/o/oauth2/v2/auth...
   ```
5. **Sign in**: Complete Google authentication
6. **After redirect**: Should see:
   ```
   🔐 OAuth callback detected
   ✅ Token stored successfully
   ✅ Google Sheets connected successfully!
   ```

---

## 📋 DETAILED TESTING CHECKLIST

### Pre-Deployment Tests

Before deploying, verify:

- [ ] `src/googleSheetsService.js` exists and contains new code
- [ ] Backup file `src/googleSheetsService_OLD_BACKUP.js` exists
- [ ] No console errors when running `npm start` locally
- [ ] Environment variables are set (check `.env` file)

### Post-Deployment Tests

After deploying to Vercel:

#### A. Page Load Test
- [ ] Go to https://janice-dashboard.vercel.app
- [ ] Page loads without errors
- [ ] No console errors (F12 → Console)
- [ ] Dashboard displays correctly

#### B. Authentication Test
- [ ] Click "Enable Google Sheets Sync"
- [ ] Redirected to Google sign-in page (NOT a popup!)
- [ ] Can select Google account
- [ ] Can see permission request
- [ ] Can click "Allow"
- [ ] Redirected back to dashboard
- [ ] See success message
- [ ] Status shows "Synced"

#### C. Sync Test
- [ ] Click "Sync Now"
- [ ] See "Syncing..." indicator
- [ ] Transactions load from Google Sheets
- [ ] Data displays in dashboard
- [ ] No errors in console

#### D. Write Test (Add)
- [ ] Click "Add Transaction"
- [ ] Fill in required fields:
  - Address: Test Property
  - City: Test City
  - Closed Price: 100000
  - Closing Date: Today's date
  - Commission %: 3
- [ ] Click "Add Transaction"
- [ ] Transaction appears in dashboard
- [ ] Open Google Sheet in another tab
- [ ] New row appears in Transactions tab
- [ ] Data matches what you entered

#### E. Write Test (Edit)
- [ ] Click edit (pencil) on a transaction
- [ ] Change the address or price
- [ ] Click "Update Transaction"
- [ ] Check Google Sheets
- [ ] Row is updated with new values

#### F. Write Test (Delete)
- [ ] Click delete (trash) on a transaction
- [ ] Confirm deletion
- [ ] Transaction disappears from dashboard
- [ ] Check Google Sheets
- [ ] Row is removed

#### G. Persistence Test
- [ ] Complete authentication
- [ ] Refresh the page (F5)
- [ ] Should still show "Synced" status
- [ ] Should NOT need to re-authenticate
- [ ] Can still sync data

#### H. Sign Out Test
- [ ] Click "Sign Out"
- [ ] Status changes to "Offline Mode"
- [ ] Click "Sync Now" - should prompt to sign in
- [ ] Data still visible from localStorage

---

## 🐛 TROUBLESHOOTING TESTS

### If "Enable Google Sheets Sync" does nothing:

**Test 1**: Check console for errors
```javascript
// Should see error messages if something is wrong
```

**Test 2**: Verify environment variables
```javascript
console.log(process.env);
// Look for REACT_APP_* variables
```

**Test 3**: Check if Google API loaded
```javascript
console.log(window.gapi);
// Should not be undefined
```

---

### If redirected but no token received:

**Test 1**: Check URL after redirect
```javascript
// After redirect, in console:
console.log(window.location.hash);
// Should contain: access_token=...
```

**Test 2**: Check sessionStorage
```javascript
console.log(sessionStorage.getItem('google_access_token'));
// Should show a long token string
```

**Test 3**: Check token expiry
```javascript
const expires = sessionStorage.getItem('google_token_expires');
console.log('Token expires:', new Date(parseInt(expires)));
// Should be ~1 hour from now
```

---

### If sync fails:

**Test 1**: Verify token is valid
```javascript
// In console:
const tokenExpires = parseInt(sessionStorage.getItem('google_token_expires') || '0');
console.log('Token valid:', tokenExpires > Date.now());
// Should be true
```

**Test 2**: Test Google Sheets API manually
```javascript
// After authentication, in console:
gapi.client.sheets.spreadsheets.values.get({
  spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
  range: 'Transactions!A2:O',
}).then(response => {
  console.log('✅ API works!', response);
}).catch(error => {
  console.error('❌ API failed:', error);
});
```

**Test 3**: Check spreadsheet permissions
- Open: https://docs.google.com/spreadsheets/d/1JN8qt64Jpy3PIxW9WDVmTNmDVdoHDhY0hJ4ZBVAmTnQ/edit
- Verify you have Editor access
- Verify sheet has "Transactions" tab

---

## 📊 EXPECTED CONSOLE LOGS

### During Initial Load:
```
🚀 Initializing Google Sheets (Fixed OAuth Flow)...
✅ GAPI initialized
✅ Ready
```

### During Sign In:
```
🔐 Starting OAuth sign-in...
📍 Redirect URI: https://janice-dashboard.vercel.app/
🔐 Redirecting to: https://accounts.google.com/o/oauth2/v2/auth?...
```

### After Redirect:
```
🔐 OAuth callback detected
✅ Token stored successfully
```

### During Sync:
```
📊 Reading from Google Sheets...
✅ Loaded X transactions
```

### During Write:
```
💾 Writing to Google Sheets...
✅ Wrote X transactions
```

---

## ✅ SUCCESS CRITERIA

OAuth is working correctly if:

1. ✅ No popup blockers triggered
2. ✅ Full page redirects to Google (not popup)
3. ✅ Can complete authentication
4. ✅ Redirected back to dashboard
5. ✅ Token stored in sessionStorage
6. ✅ Can read from Google Sheets
7. ✅ Can write to Google Sheets
8. ✅ Token persists on page refresh (within 1 hour)
9. ✅ No COOP errors in console
10. ✅ No redirect_uri_mismatch errors

---

## 🎯 PERFORMANCE BENCHMARKS

### Expected Timings:

- **Initial page load**: < 3 seconds
- **Google sign-in redirect**: Immediate
- **OAuth callback processing**: < 1 second
- **Sync (read) 86 transactions**: < 2 seconds
- **Sync (write) 86 transactions**: < 3 seconds
- **Add single transaction**: < 1 second

If timings are significantly slower, check:
- Internet connection speed
- Google Sheets API quotas
- Browser performance

---

## 🔍 DEBUG COMMANDS

### Check Current Authentication State:
```javascript
// Paste in console
console.log({
  hasToken: !!sessionStorage.getItem('google_access_token'),
  tokenExpires: new Date(parseInt(sessionStorage.getItem('google_token_expires') || '0')),
  isValid: parseInt(sessionStorage.getItem('google_token_expires') || '0') > Date.now(),
  timeLeft: Math.floor((parseInt(sessionStorage.getItem('google_token_expires') || '0') - Date.now()) / 1000 / 60) + ' minutes'
});
```

### Force Token Refresh:
```javascript
// Clear token and re-authenticate
sessionStorage.removeItem('google_access_token');
sessionStorage.removeItem('google_token_expires');
// Then click "Enable Google Sheets Sync" again
```

### Test API Connection:
```javascript
// Check if GAPI is ready
console.log({
  gapiLoaded: !!window.gapi,
  clientLoaded: !!window.gapi?.client,
  sheetsAPILoaded: !!window.gapi?.client?.sheets,
  currentToken: window.gapi?.client?.getToken()
});
```

---

## 📞 REPORTING ISSUES

If tests fail, collect this information:

1. **Browser Info**:
   ```javascript
   console.log({
     userAgent: navigator.userAgent,
     platform: navigator.platform
   });
   ```

2. **Environment Check**:
   ```javascript
   console.log({
     clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
     apiKey: process.env.REACT_APP_GOOGLE_API_KEY?.substring(0, 20) + '...',
     spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID
   });
   ```

3. **Error Details**:
   - Copy full error message from console
   - Include stack trace
   - Screenshot of error

4. **Steps to Reproduce**:
   - What you clicked
   - What you expected
   - What actually happened

---

## 🎉 ALL TESTS PASSING?

If all tests pass, your OAuth implementation is working correctly!

You can now:
- ✅ Use Google Sheets sync confidently
- ✅ Deploy to production
- ✅ Move on to v3.3 feature development
- ✅ Share with other users

**Congrats! OAuth is fixed!** 🚀

