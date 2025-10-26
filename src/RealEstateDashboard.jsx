import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Home, Calendar, Edit2, Trash2, X, Plus, Filter, Download, Upload, RefreshCw, LogOut, Cloud, CloudOff } from 'lucide-react';
import * as GoogleSheetsService from './googleSheetsService';
import ThemeToggle from './ThemeToggle';

/**
 * Janice Glaab Real Estate Commission Dashboard
 * 
 * @version 3.3.2
 * @description Professional dashboard for tracking real estate commissions with Google Sheets integration
 * 
 * ✨ KEY FEATURES:
 * 
 * 🔄 Google Sheets Integration:
 * - Two-way sync (dashboard ↔ sheets)
 * - OAuth 2.0 authentication
 * - Auto-sync on all CRUD operations
 * - Offline mode with localStorage
 * - Manual sync button
 * 
 * 📊 Analytics & Visualizations:
 * - Commission calculations (GCI, Adjusted GCI, NCI)
 * - Interactive charts (Line, Bar, Pie)
 * - Year-over-year tracking
 * - Real-time metrics
 * 
 * 🎨 Modern UI/UX:
 * - Color-coded buyer (blue) / seller (gold) cards
 * - Dark/Light/System theme support
 * - Transaction detail modal (click to view)
 * - Chronological sorting with toggle
 * - Responsive design
 * 
 * 📝 Transaction Management:
 * - Full CRUD operations
 * - 22-field comprehensive tracking
 * - KW & BDH brokerage support
 * - Data validation
 * 
 * 🎯 Advanced Features:
 * - Multi-filter system (Year, Client Type, Brokerage, Property Type)
 * - CSV export
 * - Emoji indicators for quick scanning
 * - ESC key shortcuts
 * - Persistent preferences
 * 
 * @author Dana Dube
 * @for Janice Glaab Real Estate
 */

// Custom Tahoe-style Tooltip Component
const TahoeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-morphism bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 border-2 border-white/30 dark:border-gray-600/30">
        <p className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
              ? `$${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EnhancedRealEstateDashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  
  // Google Sheets State
  const [isGoogleSheetsEnabled, setIsGoogleSheetsEnabled] = useState(false);
  const [isGoogleSheetsAuthorized, setIsGoogleSheetsAuthorized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Filters - All in one row at top
  const [filterYear, setFilterYear] = useState('all');
  const [filterClientType, setFilterClientType] = useState('all');
  const [filterBrokerage, setFilterBrokerage] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  
  // Sort order - newest or oldest first
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('transactionSortOrder') || 'newest';
  });
  
  // Logo State
  const [customLogo, setCustomLogo] = useState(() => {
    return localStorage.getItem('customLogo') || null;
  });
  
  // Form Data State
  const [formData, setFormData] = useState({
    // Basic Info
    propertyType: 'Residential',
    clientType: 'Seller',
    source: '',
    address: '',
    city: '',
    listPrice: '',
    closedPrice: '',
    listDate: '',
    closingDate: '',
    status: 'Closed',
    
    // Commission Fields
    brokerage: 'KW',
    commissionPct: '',
    referralPct: '',
    referralDollar: '',
    netVolume: '',
    
    // KW Specific
    eo: '',
    royalty: '',
    companyDollar: '',
    hoaTransfer: '',
    homeWarranty: '',
    kwCares: '',
    kwNextGen: '',
    boldScholarship: '',
    tcConcierge: '',
    jelmbergTeam: '',
    
    // BDH Specific
    bdhSplitPct: '',
    asf: '',
    foundation10: '',
    adminFee: '',
    preSplitDeduction: '',
    
    // Universal
    otherDeductions: '',
    buyersAgentSplit: '',
    assistantBonus: '', // FYI only, not in commission calc
    
    // Calculated (auto-filled)
    gci: '',
    adjustedGci: '',
    totalBrokerageFees: '',
    nci: ''
  });

  // ==================== INITIALIZATION ====================
  
  useEffect(() => {
    initializeApp();
    
    // Listen for OAuth success event (after redirect)
    const handleOAuthSuccess = async () => {
      console.log('🎉 OAuth success event detected, updating UI...');
      setIsGoogleSheetsEnabled(true);
      setIsGoogleSheetsAuthorized(true);
      localStorage.setItem('googleSheetsEnabled', 'true');
      
      // Load data from Google Sheets
      try {
        await loadFromGoogleSheets();
      } catch (error) {
        console.error('Error loading after OAuth:', error);
        setSyncError('Failed to load data: ' + error.message);
      }
    };
    
    // Handle ESC key to close modals
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        closeViewModal();
        resetForm();
      }
    };
    
    window.addEventListener('googleAuthSuccess', handleOAuthSuccess);
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('googleAuthSuccess', handleOAuthSuccess);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Always initialize Google Sheets API
      await GoogleSheetsService.initializeGoogleSheets();
      
      // Check if user just completed OAuth (has valid token)
      if (GoogleSheetsService.isAuthorized()) {
        console.log('✅ User is authorized, enabling Google Sheets sync');
        setIsGoogleSheetsEnabled(true);
        setIsGoogleSheetsAuthorized(true);
        localStorage.setItem('googleSheetsEnabled', 'true');
        await loadFromGoogleSheets();
      } else {
        // Check if Google Sheets was previously enabled
        const sheetsEnabled = localStorage.getItem('googleSheetsEnabled') === 'true';
        setIsGoogleSheetsEnabled(sheetsEnabled);
        
        if (sheetsEnabled) {
          console.log('⚠️ Google Sheets was enabled but token expired');
          setSyncError('Session expired. Please sign in again.');
        }
        
        // Load from localStorage
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSyncError('Failed to initialize: ' + error.message);
      loadFromLocalStorage();
    }
  };

  // ==================== DATA LOADING ====================
  
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('realEstateTransactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  };

  const loadFromGoogleSheets = async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const data = await GoogleSheetsService.readFromGoogleSheets();
      setTransactions(data);
      setLastSyncTime(new Date());
      
      // Also save to localStorage as backup
      localStorage.setItem('realEstateTransactions', JSON.stringify(data));
    } catch (error) {
      console.error('Error loading from Google Sheets:', error);
      setSyncError('Failed to load from Google Sheets');
      
      // Fall back to localStorage
      loadFromLocalStorage();
    } finally {
      setIsSyncing(false);
    }
  };

  // ==================== GOOGLE SHEETS SYNC ====================
  
  const enableGoogleSheets = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // Initialize if not already done
      if (!isGoogleSheetsEnabled) {
        await GoogleSheetsService.initializeGoogleSheets();
      }
      
      // Authorize user
      await GoogleSheetsService.authorizeUser();
      
      setIsGoogleSheetsEnabled(true);
      setIsGoogleSheetsAuthorized(true);
      localStorage.setItem('googleSheetsEnabled', 'true');
      
      // Load data from Google Sheets
      await loadFromGoogleSheets();
      
    } catch (error) {
      console.error('Error enabling Google Sheets:', error);
      setSyncError('Failed to enable Google Sheets: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncNow = async () => {
    if (!isGoogleSheetsAuthorized) {
      setSyncError('Please authorize Google Sheets first');
      return;
    }
    
    await loadFromGoogleSheets();
  };

  const signOutGoogleSheets = async () => {
    try {
      await GoogleSheetsService.signOut();
      setIsGoogleSheetsEnabled(false);
      setIsGoogleSheetsAuthorized(false);
      localStorage.setItem('googleSheetsEnabled', 'false');
      setSyncError(null);
      setLastSyncTime(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setSyncError('Failed to sign out');
    }
  };

  const saveToGoogleSheets = async (data) => {
    if (!isGoogleSheetsAuthorized) return;
    
    try {
      await GoogleSheetsService.writeToGoogleSheets(data);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setSyncError('Failed to save to Google Sheets');
    }
  };

  // ==================== DATA PERSISTENCE ====================
  
  const saveTransactions = async (data) => {
    // Always save to localStorage as backup
    localStorage.setItem('realEstateTransactions', JSON.stringify(data));
    setTransactions(data);
    
    // Also save to Google Sheets if enabled
    if (isGoogleSheetsAuthorized) {
      await saveToGoogleSheets(data);
    }
  };

  // ==================== COMMISSION CALCULATIONS ====================
  
  const calculateCommission = (data) => {
    const {
      brokerage,
      closedPrice = 0,
      commissionPct = 0,
      referralPct = 0,
      
      // KW fields
      eo = 0,
      hoaTransfer = 0,
      homeWarranty = 0,
      kwCares = 0,
      kwNextGen = 0,
      boldScholarship = 0,
      tcConcierge = 0,
      jelmbergTeam = 0,
      
      // BDH fields
      bdhSplitPct = 0,
      asf = 0,
      foundation10 = 0,
      adminFee = 0,
      
      // Universal
      otherDeductions = 0,
      buyersAgentSplit = 0
    } = data;

    // Parse all values as numbers
    const price = parseFloat(closedPrice) || 0;
    const commPct = parseFloat(commissionPct) || 0;
    const refPct = parseFloat(referralPct) || 0;

    // Calculate GCI (Gross Commission Income)
    const gci = price * (commPct / 100);

    // Calculate Referral Dollar if referral percentage is provided
    const referralDollar = refPct > 0 ? gci * (refPct / 100) : 0;

    // Calculate Adjusted GCI (after referral)
    const adjustedGci = gci - referralDollar;

    let totalBrokerageFees = 0;
    let nci = 0;

    if (brokerage === 'KW') {
      // KW Commission Calculation
      const royalty = adjustedGci * 0.06; // 6% of Adjusted GCI
      const companyDollar = adjustedGci * 0.10; // 10% of Adjusted GCI
      
      totalBrokerageFees = 
        parseFloat(eo) || 0 +
        royalty +
        companyDollar +
        (parseFloat(hoaTransfer) || 0) +
        (parseFloat(homeWarranty) || 0) +
        (parseFloat(kwCares) || 0) +
        (parseFloat(kwNextGen) || 0) +
        (parseFloat(boldScholarship) || 0) +
        (parseFloat(tcConcierge) || 0) +
        (parseFloat(jelmbergTeam) || 0) +
        (parseFloat(otherDeductions) || 0) +
        (parseFloat(buyersAgentSplit) || 0);

      nci = adjustedGci - totalBrokerageFees;

      return {
        gci: gci.toFixed(2),
        referralDollar: referralDollar.toFixed(2),
        adjustedGci: adjustedGci.toFixed(2),
        royalty: royalty.toFixed(2),
        companyDollar: companyDollar.toFixed(2),
        totalBrokerageFees: totalBrokerageFees.toFixed(2),
        nci: nci.toFixed(2),
        netVolume: price.toFixed(2)
      };
    } else if (brokerage === 'BDH') {
      // BDH Commission Calculation
      const splitPct = parseFloat(bdhSplitPct) || 94; // Default 94%
      const preSplitDeduction = adjustedGci * 0.06; // 6% pre-split deduction
      const afterPreSplit = adjustedGci - preSplitDeduction;
      const agentSplit = afterPreSplit * (splitPct / 100);
      
      totalBrokerageFees = 
        preSplitDeduction +
        (adjustedGci - agentSplit) + // Brokerage portion
        (parseFloat(asf) || 0) +
        (parseFloat(foundation10) || 0) +
        (parseFloat(adminFee) || 0) +
        (parseFloat(otherDeductions) || 0) +
        (parseFloat(buyersAgentSplit) || 0);

      nci = adjustedGci - totalBrokerageFees;

      return {
        gci: gci.toFixed(2),
        referralDollar: referralDollar.toFixed(2),
        adjustedGci: adjustedGci.toFixed(2),
        preSplitDeduction: preSplitDeduction.toFixed(2),
        totalBrokerageFees: totalBrokerageFees.toFixed(2),
        nci: nci.toFixed(2),
        netVolume: price.toFixed(2)
      };
    }

    return {
      gci: gci.toFixed(2),
      referralDollar: referralDollar.toFixed(2),
      adjustedGci: adjustedGci.toFixed(2),
      totalBrokerageFees: '0.00',
      nci: adjustedGci.toFixed(2),
      netVolume: price.toFixed(2)
    };
  };

  // ==================== FORM HANDLERS ====================
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Auto-calculate if relevant fields change
    if (['closedPrice', 'commissionPct', 'referralPct', 'brokerage'].includes(name)) {
      const calculated = calculateCommission(newFormData);
      newFormData.gci = calculated.gci;
      newFormData.referralDollar = calculated.referralDollar;
      newFormData.adjustedGci = calculated.adjustedGci;
      newFormData.totalBrokerageFees = calculated.totalBrokerageFees;
      newFormData.nci = calculated.nci;
      newFormData.netVolume = calculated.netVolume;
      
      if (newFormData.brokerage === 'KW') {
        newFormData.royalty = calculated.royalty;
        newFormData.companyDollar = calculated.companyDollar;
      } else if (newFormData.brokerage === 'BDH') {
        newFormData.preSplitDeduction = calculated.preSplitDeduction;
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const calculated = calculateCommission(formData);
    const transactionData = {
      ...formData,
      ...calculated,
      id: editingId || Date.now().toString(),
      createdAt: editingId ? transactions.find(t => t.id === editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedTransactions;
    if (editingId) {
      updatedTransactions = transactions.map(t => 
        t.id === editingId ? transactionData : t
      );
    } else {
      updatedTransactions = [...transactions, transactionData];
    }

    await saveTransactions(updatedTransactions);
    resetForm();
  };

  const handleView = (transaction) => {
    setViewingTransaction(transaction);
  };

  const closeViewModal = () => {
    setViewingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditingId(transaction.id);
    setShowForm(true);
    setViewingTransaction(null); // Close view modal if open
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      await saveTransactions(updatedTransactions);
    }
  };

  // ==================== LOGO MANAGEMENT ====================
  
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      // Convert to base64 and save
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target.result;
        setCustomLogo(base64Image);
        localStorage.setItem('customLogo', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogoRemove = () => {
    if (window.confirm('Remove custom logo?')) {
      setCustomLogo(null);
      localStorage.removeItem('customLogo');
    }
  };

  const resetForm = () => {
    setFormData({
      propertyType: 'Residential',
      clientType: 'Seller',
      source: '',
      address: '',
      city: '',
      listPrice: '',
      closedPrice: '',
      listDate: '',
      closingDate: '',
      status: 'Closed',
      brokerage: 'KW',
      commissionPct: '',
      referralPct: '',
      referralDollar: '',
      netVolume: '',
      eo: '',
      royalty: '',
      companyDollar: '',
      hoaTransfer: '',
      homeWarranty: '',
      kwCares: '',
      kwNextGen: '',
      boldScholarship: '',
      tcConcierge: '',
      jelmbergTeam: '',
      bdhSplitPct: '',
      asf: '',
      foundation10: '',
      adminFee: '',
      preSplitDeduction: '',
      otherDeductions: '',
      buyersAgentSplit: '',
      assistantBonus: '',
      gci: '',
      adjustedGci: '',
      totalBrokerageFees: '',
      nci: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  // ==================== FILTERING & SORTING ====================
  
  const filteredTransactions = transactions.filter(transaction => {
    const year = transaction.closingDate ? new Date(transaction.closingDate).getFullYear().toString() : '';
    
    if (filterYear !== 'all' && year !== filterYear) return false;
    if (filterClientType !== 'all' && transaction.clientType !== filterClientType) return false;
    if (filterBrokerage !== 'all' && transaction.brokerage !== filterBrokerage) return false;
    if (filterPropertyType !== 'all' && transaction.propertyType !== filterPropertyType) return false;
    
    return true;
  }).sort((a, b) => {
    // Sort by closing date
    const dateA = a.closingDate ? new Date(a.closingDate).getTime() : 0;
    const dateB = b.closingDate ? new Date(b.closingDate).getTime() : 0;
    
    // Newest first (descending) or oldest first (ascending)
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  
  // Toggle sort order function
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    setSortOrder(newOrder);
    localStorage.setItem('transactionSortOrder', newOrder);
  };

  // ==================== METRICS ====================
  
  const metrics = {
    totalGCI: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.gci) || 0), 0),
    totalNCI: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0),
    totalTransactions: filteredTransactions.length,
    avgCommission: filteredTransactions.length > 0 
      ? filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) / filteredTransactions.length 
      : 0,
    totalVolume: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.closedPrice) || 0), 0),
    totalReferralFees: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.referralDollar) || 0), 0)
  };

  // ==================== SMART INSIGHTS ====================
  
  const calculateInsights = () => {
    if (filteredTransactions.length === 0) return [];
    
    const insights = [];
    
    // Best performing month
    const monthlyData = filteredTransactions.reduce((acc, t) => {
      if (t.closingDate) {
        const month = new Date(t.closingDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = { month, nci: 0, count: 0 };
        acc[month].nci += parseFloat(t.nci) || 0;
        acc[month].count += 1;
      }
      return acc;
    }, {});
    
    const bestMonth = Object.values(monthlyData).sort((a, b) => b.nci - a.nci)[0];
    if (bestMonth) {
      insights.push({
        icon: '🏆',
        label: 'Best Month',
        value: bestMonth.month,
        subtext: `$${bestMonth.nci.toLocaleString('en-US', { minimumFractionDigits: 2 })} earned`,
        color: 'from-yellow-500 to-orange-500'
      });
    }
    
    // Top property type
    const propertyTypes = filteredTransactions.reduce((acc, t) => {
      acc[t.propertyType] = (acc[t.propertyType] || 0) + (parseFloat(t.nci) || 0);
      return acc;
    }, {});
    const topProperty = Object.entries(propertyTypes).sort((a, b) => b[1] - a[1])[0];
    if (topProperty) {
      insights.push({
        icon: '🏠',
        label: 'Top Property Type',
        value: topProperty[0],
        subtext: `$${topProperty[1].toLocaleString('en-US', { minimumFractionDigits: 2 })} in commissions`,
        color: 'from-blue-500 to-cyan-500'
      });
    }
    
    // Average days to close
    const daysToClose = filteredTransactions
      .filter(t => t.listDate && t.closingDate)
      .map(t => {
        const start = new Date(t.listDate);
        const end = new Date(t.closingDate);
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
      })
      .filter(days => days > 0);
    
    if (daysToClose.length > 0) {
      const avgDays = Math.round(daysToClose.reduce((sum, d) => sum + d, 0) / daysToClose.length);
      insights.push({
        icon: '⏱️',
        label: 'Avg Days to Close',
        value: `${avgDays} days`,
        subtext: `Based on ${daysToClose.length} transactions`,
        color: 'from-purple-500 to-pink-500'
      });
    }
    
    // Buyer vs Seller performance
    const buyerNCI = filteredTransactions.filter(t => t.clientType === 'Buyer').reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0);
    const sellerNCI = filteredTransactions.filter(t => t.clientType === 'Seller').reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0);
    const strongerSide = buyerNCI > sellerNCI ? 'Buyers' : 'Sellers';
    const percentage = Math.round((Math.max(buyerNCI, sellerNCI) / (buyerNCI + sellerNCI)) * 100);
    
    insights.push({
      icon: strongerSide === 'Buyers' ? '🔵' : '⭐',
      label: 'Stronger Side',
      value: strongerSide,
      subtext: `${percentage}% of total income`,
      color: strongerSide === 'Buyers' ? 'from-blue-500 to-indigo-500' : 'from-amber-500 to-yellow-500'
    });
    
    // Highest single commission
    const highestDeal = filteredTransactions.sort((a, b) => (parseFloat(b.nci) || 0) - (parseFloat(a.nci) || 0))[0];
    if (highestDeal) {
      insights.push({
        icon: '💎',
        label: 'Biggest Deal',
        value: `$${parseFloat(highestDeal.nci).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtext: highestDeal.address,
        color: 'from-green-500 to-emerald-500'
      });
    }
    
    return insights;
  };
  
  const smartInsights = calculateInsights();

  // ==================== CHART DATA ====================
  
  const monthlyData = filteredTransactions.reduce((acc, transaction) => {
    if (transaction.closingDate) {
      const month = new Date(transaction.closingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = { month, gci: 0, nci: 0, transactions: 0 };
      }
      acc[month].gci += parseFloat(transaction.gci) || 0;
      acc[month].nci += parseFloat(transaction.nci) || 0;
      acc[month].transactions += 1;
    }
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA - dateB;
  });

  const pieData = [
    { name: 'Buyer', value: filteredTransactions.filter(t => t.clientType === 'Buyer').length },
    { name: 'Seller', value: filteredTransactions.filter(t => t.clientType === 'Seller').length }
  ];

  const brokerageData = [
    { name: 'KW', value: filteredTransactions.filter(t => t.brokerage === 'KW').reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) },
    { name: 'BDH', value: filteredTransactions.filter(t => t.brokerage === 'BDH').reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // ==================== EXPORT ====================
  
  const exportToCSV = () => {
    const headers = [
      'Property Type', 'Client Type', 'Source', 'Address', 'City', 
      'List Price', 'Closed Price', 'List Date', 'Closing Date',
      'Brokerage', 'Commission %', 'GCI', 'Referral %', 'Referral $',
      'Adjusted GCI', 'Total Brokerage Fees', 'NCI', 'Status'
    ];

    const rows = filteredTransactions.map(t => [
      t.propertyType,
      t.clientType,
      t.source,
      t.address,
      t.city,
      t.listPrice,
      t.closedPrice,
      t.listDate,
      t.closingDate,
      t.brokerage,
      t.commissionPct,
      t.gci,
      t.referralPct,
      t.referralDollar,
      t.adjustedGci,
      t.totalBrokerageFees,
      t.nci,
      t.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ==================== RENDER ====================
  
  return (
    <div className="min-h-screen mesh-gradient bg-gray-50/50 dark:bg-gray-900/80 p-6 transition-all duration-700">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-morphism bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-2xl p-8 mb-8 border border-white/20 dark:border-gray-700/30 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              {customLogo && (
                <div className="relative group">
                  <img 
                    src={customLogo} 
                    alt="Dashboard Logo" 
                    className="w-24 h-24 rounded-2xl shadow-lg object-cover border-2 border-white/30 dark:border-gray-700/30"
                  />
                  <button
                    onClick={handleLogoRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent animate-glow">Real Estate Commission Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Track and analyze your commission income</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Logo Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 glass-morphism bg-purple-500/80 hover:bg-purple-600/80 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-xl">
                  <Upload className="w-4 h-4" />
                  <span className="font-medium text-sm">{customLogo ? 'Change Logo' : 'Upload Logo'}</span>
                </div>
              </label>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Google Sheets Sync Status */}
              {isGoogleSheetsEnabled && isGoogleSheetsAuthorized && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <Cloud className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    {isSyncing ? 'Syncing...' : 'Synced'}
                  </span>
                  {lastSyncTime && (
                    <span className="text-xs text-green-600">
                      {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
              
              {!isGoogleSheetsEnabled && (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <CloudOff className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Offline Mode</span>
                </div>
              )}
            </div>
          </div>

          {/* Google Sheets Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isGoogleSheetsAuthorized ? (
              <button
                onClick={enableGoogleSheets}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Cloud className="w-4 h-4" />
                {isSyncing ? 'Connecting...' : 'Enable Google Sheets Sync'}
              </button>
            ) : (
              <>
                <button
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <button
                  onClick={signOutGoogleSheets}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            )}

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-black to-yellow-600 text-white rounded-lg hover:from-gray-900 hover:to-yellow-500 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Sync Error Display */}
          {syncError && (
            <div className="mt-4 flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{syncError}</p>
              <button
                onClick={() => setSyncError(null)}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-3"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Info Panel */}
          {isGoogleSheetsAuthorized && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Google Sheets sync is active!</strong> Your transactions are automatically synced with your Google Sheet. 
                Changes in either location will be synchronized.
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl hover:shadow-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Transactions</h3>
            <div className="ml-auto text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {filteredTransactions.length} of {transactions.length} shown
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Year Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                📅 Closing Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all">All Years</option>
                {[...new Set(transactions.map(t => t.closingDate ? new Date(t.closingDate).getFullYear() : null))].filter(Boolean).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Client Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                👥 Transaction Type
              </label>
              <select
                value={filterClientType}
                onChange={(e) => setFilterClientType(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all">Buyers & Sellers</option>
                <option value="Buyer">🔵 Buyers Only</option>
                <option value="Seller">⭐ Sellers Only</option>
              </select>
            </div>

            {/* Brokerage Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                🏢 Brokerage
              </label>
              <select
                value={filterBrokerage}
                onChange={(e) => setFilterBrokerage(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all">All Brokerages</option>
                <option value="KW">Keller Williams</option>
                <option value="BDH">Bennion Deville Homes</option>
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                🏠 Property Type
              </label>
              <select
                value={filterPropertyType}
                onChange={(e) => setFilterPropertyType(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all">All Property Types</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Land">Land</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filterYear !== 'all' || filterClientType !== 'all' || filterBrokerage !== 'all' || filterPropertyType !== 'all') && (
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={() => {
                  setFilterYear('all');
                  setFilterClientType('all');
                  setFilterBrokerage('all');
                  setFilterPropertyType('all');
                }}
                className="px-6 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all border-2 border-blue-200 dark:border-blue-700"
              >
                ✕ Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Gross Commission Income */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">💰 Gross Commission</p>
                <p className="text-4xl font-bold mt-2 mb-1">${metrics.totalGCI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-purple-200 text-xs font-medium">Total earned before fees</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Net Commission Income */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-green-100 text-sm font-semibold uppercase tracking-wide">✅ Net Commission</p>
                <p className="text-4xl font-bold mt-2 mb-1">${metrics.totalNCI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-green-200 text-xs font-medium">Your take-home pay</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Sales Volume */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">🏘️ Total Sales Volume</p>
                <p className="text-4xl font-bold mt-2 mb-1">${metrics.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-blue-200 text-xs font-medium">Combined property value</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Home className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Average Commission */}
          <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-pink-100 text-sm font-semibold uppercase tracking-wide">📊 Average Per Deal</p>
                <p className="text-4xl font-bold mt-2 mb-1">${metrics.avgCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-pink-200 text-xs font-medium">Average commission earned</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-amber-100 text-sm font-semibold uppercase tracking-wide">🎯 Total Transactions</p>
                <p className="text-4xl font-bold mt-2 mb-1">{metrics.totalTransactions}</p>
                <p className="text-amber-200 text-xs font-medium">Deals closed successfully</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Referral Fees */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 border-2 border-white/20 backdrop-blur-sm group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-orange-100 text-sm font-semibold uppercase tracking-wide">🤝 Referral Fees</p>
                <p className="text-4xl font-bold mt-2 mb-1">${metrics.totalReferralFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-orange-200 text-xs font-medium">Paid to referral partners</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        {smartInsights.length > 0 && (
          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Insights</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Key performance highlights from your data</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {smartInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden bg-gradient-to-br ${insight.color} rounded-2xl shadow-xl p-6 text-white transform hover:-translate-y-1 hover:scale-105 transition-all duration-500 border-2 border-white/30`}
                >
                  <div className="text-4xl mb-3">{insight.icon}</div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{insight.label}</p>
                    <p className="text-xl font-bold leading-tight">{insight.value}</p>
                    <p className="text-xs opacity-80 font-medium">{insight.subtext}</p>
                  </div>
                  {/* Ambient glow effect */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Monthly Income Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<TahoeTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="gci" stroke="#d4af37" strokeWidth={2} name="GCI" />
                <Line type="monotone" dataKey="nci" stroke="#10b981" strokeWidth={2} name="NCI" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Transactions by Month</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<TahoeTooltip />} />
                <Legend />
                <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Client Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TahoeTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Income by Brokerage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brokerageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<TahoeTooltip />} />
                <Bar dataKey="value" fill="#d4af37" name="NCI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions List */}
        <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold dark:text-white">
              Filtered Transactions
              {filteredTransactions.length > 0 && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                  ({filteredTransactions.length} total)
                </span>
              )}
            </h2>
            
            {filteredTransactions.length > 0 && (
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium border border-blue-200 dark:border-blue-800 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>{sortOrder === 'newest' ? 'Newest First ↓' : 'Oldest First ↑'}</span>
              </button>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-2">
                {transactions.length === 0 
                  ? 'Add your first transaction to get started' 
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map(transaction => {
                const isBuyer = transaction.clientType === 'Buyer';
                return (
                <div
                  key={transaction.id}
                  onClick={() => handleView(transaction)}
                  className={`flex items-center justify-between p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer border-2 ${
                    isBuyer
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500'
                      : 'bg-amber-50 dark:bg-yellow-900/20 border-amber-300 dark:border-yellow-700 hover:border-amber-500 dark:hover:border-yellow-500'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={`font-bold text-lg truncate ${
                          isBuyer 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-amber-900 dark:text-yellow-100'
                        }`}>{transaction.address}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md border-2 ${
                          isBuyer
                            ? 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-400' 
                            : 'bg-amber-500 text-white border-amber-600 dark:bg-yellow-500 dark:border-yellow-400'
                        }`}>
                          {isBuyer ? '🔵 ' : '⭐ '}{transaction.clientType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                          isBuyer
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-600'
                            : 'bg-amber-100 dark:bg-yellow-800 text-amber-800 dark:text-yellow-100 border-amber-300 dark:border-yellow-600'
                        }`}>
                          {transaction.brokerage === 'KW' ? 'Keller Williams' : 'Bennion Deville Homes'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">📍</span>
                          {transaction.city}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">💰</span>
                          ${parseFloat(transaction.closedPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">📅</span>
                          {new Date(transaction.closingDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={`text-right px-4 py-3 rounded-lg shadow-md border-2 ${
                      isBuyer
                        ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/50 dark:to-blue-900/50 border-green-300 dark:border-green-600'
                        : 'bg-gradient-to-br from-green-50 to-amber-50 dark:from-green-900/50 dark:to-yellow-900/50 border-green-300 dark:border-green-600'
                    }`}>
                      <p className="text-xs text-green-700 dark:text-green-300 font-semibold uppercase tracking-wide">💵 NCI</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-200">
                        ${parseFloat(transaction.nci || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all shadow-sm hover:shadow-md"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all shadow-sm hover:shadow-md"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Janice Glaab Real Estate Dashboard v3.3.3 • Built with ❤️ by Dana Dube
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-3xl max-w-4xl backdrop-blur-3xl w-full my-8 transition-colors">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Basic Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Land">Land</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Type *</label>
                      <select
                        name="clientType"
                        value={formData.clientType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Buyer">Buyer</option>
                        <option value="Seller">Seller</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                        placeholder="e.g., Referral, Zillow, Sign Call"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brokerage *</label>
                      <select
                        name="brokerage"
                        value={formData.brokerage}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="KW">Keller Williams (KW)</option>
                        <option value="BDH">Bennion Deville Homes (BDH)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="123 Main St"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Palm Desert"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">List Price</label>
                      <input
                        type="number"
                        name="listPrice"
                        value={formData.listPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closed Price *</label>
                      <input
                        type="number"
                        name="closedPrice"
                        value={formData.closedPrice}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">List Date</label>
                      <input
                        type="date"
                        name="listDate"
                        value={formData.listDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date *</label>
                      <input
                        type="date"
                        name="closingDate"
                        value={formData.closingDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission Fields */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Commission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission % *</label>
                      <input
                        type="number"
                        name="commissionPct"
                        value={formData.commissionPct}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        placeholder="3.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral %</label>
                      <input
                        type="number"
                        name="referralPct"
                        value={formData.referralPct}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gross Commission Income (GCI)</label>
                      <input
                        type="text"
                        value={`$${formData.gci}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Fee Paid</label>
                      <input
                        type="text"
                        value={`$${formData.referralDollar}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted GCI</label>
                      <input
                        type="text"
                        value={`$${formData.adjustedGci}`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Brokerage-Specific Fields */}
                {formData.brokerage === 'KW' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Keller Williams Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Errors & Omissions (E&O)</label>
                        <input
                          type="number"
                          name="eo"
                          value={formData.eo}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Royalty (6% - Auto)</label>
                        <input
                          type="text"
                          value={`$${formData.royalty}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Dollar (10% - Auto)</label>
                        <input
                          type="text"
                          value={`$${formData.companyDollar}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HOA Transfer</label>
                        <input
                          type="number"
                          name="hoaTransfer"
                          value={formData.hoaTransfer}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Warranty</label>
                        <input
                          type="number"
                          name="homeWarranty"
                          value={formData.homeWarranty}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">KW Cares</label>
                        <input
                          type="number"
                          name="kwCares"
                          value={formData.kwCares}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NEXT GEN</label>
                        <input
                          type="number"
                          name="kwNextGen"
                          value={formData.kwNextGen}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BOLD Scholarship</label>
                        <input
                          type="number"
                          name="boldScholarship"
                          value={formData.boldScholarship}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TC/Concierge</label>
                        <input
                          type="number"
                          name="tcConcierge"
                          value={formData.tcConcierge}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jelmberg Team</label>
                        <input
                          type="number"
                          name="jelmbergTeam"
                          value={formData.jelmbergTeam}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.brokerage === 'BDH' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Bennion Deville Homes Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BDH Split % (Default: 94%)</label>
                        <input
                          type="number"
                          name="bdhSplitPct"
                          value={formData.bdhSplitPct}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="94.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Split Deduction (6% - Auto)</label>
                        <input
                          type="text"
                          value={`$${formData.preSplitDeduction}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agent Services Fee (ASF)</label>
                        <input
                          type="number"
                          name="asf"
                          value={formData.asf}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foundation10</label>
                        <input
                          type="number"
                          name="foundation10"
                          value={formData.foundation10}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Fee</label>
                        <input
                          type="number"
                          name="adminFee"
                          value={formData.adminFee}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Universal Fields */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Deductions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
                      <input
                        type="number"
                        name="otherDeductions"
                        value={formData.otherDeductions}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buyer's Agent Split</label>
                      <input
                        type="number"
                        name="buyersAgentSplit"
                        value={formData.buyersAgentSplit}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assistant Bonus (FYI only)</label>
                      <input
                        type="number"
                        name="assistantBonus"
                        value={formData.assistantBonus}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Not included in NCI calculation</p>
                    </div>
                  </div>
                </div>

                {/* Calculated Summary */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Commission Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Brokerage Fees</p>
                      <p className="text-xl font-bold text-gray-900">${formData.totalBrokerageFees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Commission (NCI)</p>
                      <p className="text-xl font-bold text-green-600">${formData.nci}</p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-black to-yellow-600 text-white rounded-lg hover:from-gray-900 hover:to-yellow-500 transition-all font-medium"
                  >
                    {editingId ? 'Update Transaction' : 'Add Transaction'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction Detail View Modal */}
        {viewingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-3xl max-w-4xl backdrop-blur-3xl w-full my-8 transition-colors">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Transaction Details
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {viewingTransaction.address} • {viewingTransaction.city}
                    </p>
                  </div>
                  <button
                    onClick={closeViewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Property Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-500" />
                    Property Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Address</label>
                      <p className="text-gray-900 dark:text-white font-medium">{viewingTransaction.address}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">City</label>
                      <p className="text-gray-900 dark:text-white font-medium">{viewingTransaction.city}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Property Type</label>
                      <p className="text-gray-900 dark:text-white font-medium">{viewingTransaction.propertyType}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Client Type</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        viewingTransaction.clientType === 'Buyer' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gold-500 text-white'
                      }`}>
                        {viewingTransaction.clientType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">List Price</label>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">
                        ${parseFloat(viewingTransaction.listPrice || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Closed Price</label>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">
                        ${parseFloat(viewingTransaction.closedPrice || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Commission %</label>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">
                        {viewingTransaction.commissionPct}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Commission Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">Gross Commission</label>
                      <p className="text-purple-900 dark:text-purple-100 font-bold text-xl">
                        ${parseFloat(viewingTransaction.gci || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">After Referrals</label>
                      <p className="text-blue-900 dark:text-blue-100 font-bold text-xl">
                        ${parseFloat(viewingTransaction.adjustedGci || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <label className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase">Total Fees</label>
                      <p className="text-orange-900 dark:text-orange-100 font-bold text-xl">
                        ${parseFloat(viewingTransaction.totalBrokerageFees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-500 dark:border-green-700">
                      <label className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">Net Commission Income</label>
                      <p className="text-green-900 dark:text-green-100 font-bold text-2xl">
                        ${parseFloat(viewingTransaction.nci || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Dates & Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">List Date</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {viewingTransaction.listDate ? new Date(viewingTransaction.listDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Closing Date</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(viewingTransaction.closingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Brokerage</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {viewingTransaction.brokerage === 'KW' ? 'Keller Williams (KW)' : 'Bennion Deville Homes (BDH)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(viewingTransaction.source || viewingTransaction.referralPct || viewingTransaction.assistantBonus || viewingTransaction.buyersAgentSplit) && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      {viewingTransaction.source && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Source</label>
                          <p className="text-gray-900 dark:text-white font-medium">{viewingTransaction.source}</p>
                        </div>
                      )}
                      {viewingTransaction.referralPct > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Referral Fee</label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {viewingTransaction.referralPct}% (${parseFloat(viewingTransaction.referralDollar || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                          </p>
                        </div>
                      )}
                      {viewingTransaction.assistantBonus > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Assistant Bonus</label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            ${parseFloat(viewingTransaction.assistantBonus).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {viewingTransaction.buyersAgentSplit > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Buyer's Agent Split</label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            ${parseFloat(viewingTransaction.buyersAgentSplit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                <button
                  onClick={closeViewModal}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDelete(viewingTransaction.id)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleEdit(viewingTransaction)}
                    className="px-6 py-3 bg-gradient-to-r from-black to-yellow-600 text-white rounded-lg hover:from-gray-900 hover:to-yellow-500 transition-all font-medium shadow-sm"
                  >
                    Edit Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRealEstateDashboard;
