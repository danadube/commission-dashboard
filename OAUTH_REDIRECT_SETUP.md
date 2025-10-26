# 🔐 OAuth Redirect URI Setup Guide

**CRITICAL STEP** - This must be configured correctly for OAuth to work!

---

## 🎯 WHERE TO GO

1. **Google Cloud Console Credentials Page**:
   https://console.cloud.google.com/apis/credentials

2. **Project**: glaab-real-estate-transactions

3. **Find**: OAuth 2.0 Client IDs section

4. **Your Client ID**: 
   ```
   1078687391989-6u2n0er2d21ut0tcgtuem5jle0gdvd66.apps.googleusercontent.com
   ```

---

## ✅ EXACT CONFIGURATION NEEDED

Click "Edit" on your OAuth 2.0 Client ID and set:

### Authorized JavaScript Origins

Add these TWO origins (if not already present):

```
https://janice-dashboard.vercel.app
http://localhost:3000
```

**Notes**:
- ⚠️ **NO trailing slash** for JavaScript origins
- ⚠️ **NO `www.`** - use exact domain
- ⚠️ **Include `http://` for localhost** (for local development)

---

### Authorized Redirect URIs

Add these TWO redirect URIs (if not already present):

```
https://janice-dashboard.vercel.app/
http://localhost:3000/
```

**Notes**:
- ⚠️ **MUST HAVE trailing slash `/`** for redirect URIs
- ⚠️ This is the most common mistake - the slash is REQUIRED!
- ⚠️ **Include `http://` for localhost** (for local development)

---

## 📋 VISUAL CHECKLIST

Your OAuth 2.0 Client ID configuration should look like this:

```
┌─────────────────────────────────────────────────────┐
│ Edit OAuth 2.0 Client ID                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Name:                                               │
│ ┌────────────────────────────────────────────┐     │
│ │ Janice Dashboard (or your chosen name)     │     │
│ └────────────────────────────────────────────┘     │
│                                                      │
│ Authorized JavaScript origins:                      │
│ ┌────────────────────────────────────────────┐     │
│ │ https://janice-dashboard.vercel.app        │     │
│ │ http://localhost:3000                      │     │
│ └────────────────────────────────────────────┘     │
│                                                      │
│ Authorized redirect URIs:                           │
│ ┌────────────────────────────────────────────┐     │
│ │ https://janice-dashboard.vercel.app/       │ ◄── Note the slash!
│ │ http://localhost:3000/                     │ ◄── Note the slash!
│ └────────────────────────────────────────────┘     │
│                                                      │
│           [Cancel]  [Save]                          │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ COMMON MISTAKES

### ❌ WRONG: Missing trailing slash on redirect URI
```
https://janice-dashboard.vercel.app    ← NO SLASH - Will fail!
```

### ✅ CORRECT: Trailing slash included
```
https://janice-dashboard.vercel.app/   ← WITH SLASH - Will work!
```

---

### ❌ WRONG: Adding slash to JavaScript origin
```
https://janice-dashboard.vercel.app/   ← SLASH HERE - Will fail!
```

### ✅ CORRECT: No trailing slash on origin
```
https://janice-dashboard.vercel.app    ← NO SLASH - Will work!
```

---

### ❌ WRONG: Using www subdomain
```
https://www.janice-dashboard.vercel.app/
```

### ✅ CORRECT: Exact domain from Vercel
```
https://janice-dashboard.vercel.app/
```

---

### ❌ WRONG: Using https for localhost
```
https://localhost:3000/
```

### ✅ CORRECT: Use http for localhost
```
http://localhost:3000/
```

---

## 🔍 HOW TO VERIFY

After saving, you should see:

1. **Authorized JavaScript origins** (2 URIs):
   - https://janice-dashboard.vercel.app
   - http://localhost:3000

2. **Authorized redirect URIs** (2 URIs):
   - https://janice-dashboard.vercel.app/
   - http://localhost:3000/

---

## 🐛 ERROR MESSAGES & FIXES

### Error: "redirect_uri_mismatch"

**What you'll see**:
```
Error 400: redirect_uri_mismatch

The redirect URI in the request: https://janice-dashboard.vercel.app/
does not match the ones authorized for the OAuth client.
```

**Fix**:
1. Copy the EXACT redirect URI from the error message
2. Go to OAuth Client ID settings
3. Add that EXACT URI to Authorized redirect URIs
4. Click Save
5. Try again

### Error: "origin_mismatch"

**What you'll see**:
```
Error: origin_mismatch
```

**Fix**:
1. Check Authorized JavaScript origins
2. Make sure it matches your app's origin EXACTLY
3. No trailing slash for origins
4. Click Save

---

## 🎯 COPY-PASTE VALUES

For your convenience, here are the exact values to copy:

### JavaScript Origins:
```
https://janice-dashboard.vercel.app
```
```
http://localhost:3000
```

### Redirect URIs:
```
https://janice-dashboard.vercel.app/
```
```
http://localhost:3000/
```

---

## 📝 SETUP STEPS

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Select Project**: glaab-real-estate-transactions (top left dropdown)
3. **Find**: "OAuth 2.0 Client IDs" section
4. **Click**: Your client ID (starts with 1078687391989...)
5. **Click**: "Edit" (pencil icon)
6. **Add Origins**: Copy JavaScript origins from above
7. **Add Redirect URIs**: Copy redirect URIs from above (with slashes!)
8. **Click**: "Save" button
9. **Wait**: ~30 seconds for changes to propagate
10. **Test**: Deploy your app and try OAuth

---

## ✅ VERIFICATION

To verify your setup is correct:

1. Go to your OAuth Client ID in Google Cloud Console
2. Check that you have EXACTLY:
   - 2 JavaScript origins (no trailing slash)
   - 2 Redirect URIs (WITH trailing slash)
3. Origins and URIs match your domains exactly
4. No extra spaces, no www., correct protocol (http/https)

---

## 🕒 PROPAGATION TIME

After saving changes:
- **Immediate**: Usually works right away
- **Up to 5 minutes**: For global propagation
- **If still not working**: Clear browser cache and try again

---

## 🎉 DONE!

Once you've saved these settings:

1. ✅ OAuth redirect will work
2. ✅ Users can authenticate
3. ✅ Google Sheets sync will function
4. ✅ No more "redirect_uri_mismatch" errors

---

## 📞 STILL STUCK?

If you're still seeing redirect errors:

1. Double-check for trailing slashes
2. Copy-paste URIs directly (don't type them)
3. Wait 5 minutes after saving
4. Clear browser cache completely
5. Try in incognito mode
6. Check for typos in the domain name

**The most common issue is forgetting the trailing slash on redirect URIs!**

---

**Remember**: 
- JavaScript Origins = **NO** slash
- Redirect URIs = **WITH** slash

Get this right, and OAuth will work perfectly! 🚀

