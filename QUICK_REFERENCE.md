# 🚀 Quick Reference Card - OAuth Fix

**Print this or save for quick reference!**

---

## ⚡ 3-STEP DEPLOY

### 1️⃣ Google Cloud Console
```
URL: https://console.cloud.google.com/apis/credentials
Project: glaab-real-estate-transactions
Action: Edit OAuth 2.0 Client ID

Add Redirect URIs (WITH slash):
✓ https://janice-dashboard.vercel.app/
✓ http://localhost:3000/

Add JavaScript Origins (NO slash):
✓ https://janice-dashboard.vercel.app
✓ http://localhost:3000
```

### 2️⃣ Deploy
```bash
git add .
git commit -m "Fix: Google Sheets OAuth"
git push origin main
```

### 3️⃣ Test
```
URL: https://janice-dashboard.vercel.app
Click: "Enable Google Sheets Sync"
Sign in with Google
Done! ✅
```

---

## 🔐 Environment Variables

```
REACT_APP_GOOGLE_CLIENT_ID=1078687391989-6u2n0er2d21ut0tcgtuem5jle0gdvd66.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=AIzaSyDbk_SNH6Fn84Fv_PdnXCWwIh6OvGN9Sj0
REACT_APP_SPREADSHEET_ID=1JN8qt64Jpy3PIxW9WDVmTNmDVdoHDhY0hJ4ZBVAmTnQ
```

---

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add URI to Google Cloud Console |
| `Not authenticated` | Click "Enable Google Sheets Sync" |
| `origin_mismatch` | Check JavaScript origins |
| Button does nothing | Check console for errors |

---

## 📞 Important URLs

| Resource | URL |
|----------|-----|
| Dashboard | https://janice-dashboard.vercel.app |
| Vercel Project | https://vercel.com/danas-projects-3d9348e4/janice-dashboard |
| Google Console | https://console.cloud.google.com/apis/credentials |
| Google Sheet | https://docs.google.com/spreadsheets/d/1JN8qt64Jpy3PIxW9WDVmTNmDVdoHDhY0hJ4ZBVAmTnQ/edit |
| GitHub Repo | https://github.com/danadube/janice-dashboard |

---

## ✅ Post-Deploy Checklist

- [ ] OAuth settings correct in Google Cloud
- [ ] Env vars set in Vercel
- [ ] Code deployed (git push)
- [ ] Page loads without errors
- [ ] Can click "Enable Google Sheets Sync"
- [ ] Redirects to Google (not popup)
- [ ] Can sign in
- [ ] Redirects back to dashboard
- [ ] Success message shown
- [ ] "Synced" status displayed
- [ ] Can sync data
- [ ] Can add/edit/delete transactions

---

## 🔍 Debug Commands

**Check auth state**:
```javascript
console.log({
  hasToken: !!sessionStorage.getItem('google_access_token'),
  expires: new Date(parseInt(sessionStorage.getItem('google_token_expires')))
});
```

**Check environment**:
```javascript
console.log({
  clientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
  apiKey: !!process.env.REACT_APP_GOOGLE_API_KEY,
  spreadsheetId: !!process.env.REACT_APP_SPREADSHEET_ID
});
```

**Check API loaded**:
```javascript
console.log(!!window.gapi);
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `OAUTH_FIX_SUMMARY.md` | Overview & checklist |
| `DEPLOY_OAUTH_FIX.md` | Deployment guide |
| `OAUTH_REDIRECT_SETUP.md` | Google Console setup |
| `GOOGLE_SHEETS_SYNC_FIX.md` | Troubleshooting |
| `TEST_OAUTH.md` | Testing guide |
| `QUICK_REFERENCE.md` | This file |

---

## ⚠️ Remember

- **Redirect URIs** need trailing slash `/`
- **JavaScript Origins** DON'T need slash
- Tokens expire after 1 hour
- Changes in Google Console take ~30 seconds to propagate
- Always check browser console for errors

---

## 🎯 Success Indicators

✅ No COOP errors  
✅ No popup blockers  
✅ Full page redirects (normal behavior)  
✅ "Synced" status after auth  
✅ Can read from Google Sheets  
✅ Can write to Google Sheets  
✅ Token persists on refresh  

---

## 📞 Support

**Issues? Check**:
1. Browser console (F12)
2. OAuth settings in Google Cloud
3. Environment variables in Vercel
4. Documentation files above

**90% of issues**: Missing trailing slash on redirect URI!

---

**Keep this handy for quick reference!** 🚀

