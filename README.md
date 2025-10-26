# Janice Glaab Real Estate Commission Dashboard

Professional real estate performance dashboard with automatic Google Sheets synchronization, beautiful UI, and comprehensive analytics.

**Live App:** [https://janice-dashboard.vercel.app](https://janice-dashboard.vercel.app)

---

## ✨ Features

### 📊 **Analytics & Metrics**
- Real-time commission calculations (GCI, NCI, fees)
- Interactive charts and visualizations
- Year-over-year performance tracking
- Total transaction volume and averages

### 🔄 **Google Sheets Integration**
- Two-way sync with Google Sheets
- OAuth 2.0 secure authentication
- Automatic sync on all CRUD operations
- Offline mode with localStorage backup

### 📝 **Transaction Management**
- Add, edit, and delete transactions
- Beautiful detail modal (click to view)
- Full CRUD operations
- 22-field comprehensive tracking

### 🎨 **Modern UI/UX**
- **Color-coded cards**: Blue for buyers, Gold for sellers
- **Theme system**: Light, Dark, and System preference matching
- **Chronological sorting**: Newest or oldest first
- **Responsive design**: Works on all devices
- **Emoji indicators**: Quick visual scanning

### 🎯 **Advanced Filtering**
- Filter by Year
- Filter by Client Type (Buyer/Seller)
- Filter by Brokerage (KW/BDH)
- Filter by Property Type

### 📤 **Export & Data**
- Export to CSV
- Persistent localStorage
- Data validation

---

## 🚀 Quick Start

### **For Users:**
1. Visit [https://janice-dashboard.vercel.app](https://janice-dashboard.vercel.app)
2. Toggle **"Enable Google Sheets Sync"** ON
3. Click **"Connect to Google Sheets"** and authorize
4. Your data syncs automatically!

### **For Developers:**

```bash
# Clone the repository
git clone https://github.com/danadube/janice-dashboard.git
cd janice-dashboard

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Google API credentials

# Run development server
npm start
```

---

## 🔧 Configuration

### **Environment Variables**
Create a `.env.local` file:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SPREADSHEET_ID=your-google-sheet-id
```

### **Google Sheets Setup**
Your Google Sheet should have these columns (A-W):
- A: Property Type
- B: Client Type
- C: Source
- D: Address
- E: City
- F: List Price
- G: Commission %
- H: List Date
- I: Closing Date
- J: Brokerage
- K: Net Volume
- L: Closed Price
- M: GCI
- N: Referral %
- O: Referral $
- P: Adjusted GCI
- Q: Pre-split Deduction
- R: Brokerage Split
- S: Admin Fees/Other Deductions
- T: NCI
- U: Status
- V: Assistant Bonus
- W: Buyer's Agent Split

---

## 📦 Tech Stack

- **Frontend:** React (functional components with hooks)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **API:** Google Sheets API v4 (OAuth 2.0 Implicit Flow)
- **Deployment:** Vercel
- **Storage:** localStorage (with Google Sheets sync)

---

## 🎯 Current Version: v3.3.2

### **Recent Updates:**
- ✅ Color-coded buyer/seller transaction cards
- ✅ Transaction detail modal (click to view)
- ✅ Chronological sorting with toggle
- ✅ Dark/Light/System theme support
- ✅ Enhanced card readability and visual design
- ✅ Google Sheets OAuth integration fixed
- ✅ 22-column data mapping
- ✅ Brokerage column support (KW/BDH)

---

## 📄 Project Structure

```
janice-dashboard/
├── public/
│   ├── index.html          # Main HTML file
│   └── janice-logo.png     # App logo
├── src/
│   ├── RealEstateDashboard.jsx  # Main dashboard component
│   ├── googleSheetsService.js   # Google Sheets API service
│   ├── ThemeContext.jsx         # Theme management context
│   ├── ThemeToggle.jsx          # Theme toggle component
│   └── index.js                 # App entry point
├── api/
│   └── auth/
│       └── google.js       # OAuth serverless function (backup)
├── .env.local              # Environment variables (create this)
├── env.example             # Example environment file
├── package.json            # Dependencies
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

---

## 🔐 Security

- OAuth 2.0 for secure Google authentication
- Client-side only (no sensitive data on server)
- Environment variables for API keys
- HTTPS enforced via Vercel

---

## 🤝 Contributing

This is a private dashboard for Janice Glaab's real estate business. For feature requests or issues, please contact the development team.

---

## 📊 Future Roadmap

- [ ] Agent performance comparisons
- [ ] Goal tracking and projections
- [ ] Email notifications for milestones
- [ ] Mobile app version
- [ ] Multi-agent SaaS platform expansion
- [ ] Advanced reporting and insights
- [ ] Integration with CRM systems

---

## 📞 Support

For technical support or questions:
- **Developer:** Dana Dube
- **Repository:** [github.com/danadube/janice-dashboard](https://github.com/danadube/janice-dashboard)

---

## 📝 License

Private/Proprietary - All rights reserved.

---

**Built with ❤️ for real estate professionals**
