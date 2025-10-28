import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Home, Calendar, Edit2, Trash2, X, Plus, Filter, Download, Upload, RefreshCw, LogOut, Cloud, CloudOff, Settings } from 'lucide-react';
import * as GoogleSheetsService from './googleSheetsService';
import ThemeToggle from './ThemeToggle';

/**
 * Real Estate Commission Dashboard
 * 
 * @version 3.15.0
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
 * - 8-point grid spacing system
 * - HSB color system with proper contrast ✨ NEW
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
 * @for Real Estate Commission Tracking
 */

// Custom Tahoe-style Tooltip Component
const TahoeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-morphism bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 border-2 border-white/50 dark:border-gray-600/50 z-50">
        <p className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold text-gray-800 dark:text-gray-200" style={{ color: entry.color }}>
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

// Skeleton Loader Components for Initial Loading States with Brand Colors
const SkeletonMetricCard = () => (
  <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-6 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-800 rounded-xl"></div>
    </div>
    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg mb-2 w-3/4"></div>
    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-pulse">
    <div className="h-6 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-800 rounded-lg mb-6 w-1/3"></div>
    <div className="h-[300px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-xl"></div>
  </div>
);

const SkeletonTransactionCard = () => (
  <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-xl p-6 border-2 border-white/30 dark:border-gray-700/30 backdrop-blur-2xl animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-6 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-800 rounded-lg w-1/2"></div>
      <div className="h-6 bg-gradient-to-r from-info-200 to-warning-200 dark:from-info-700 dark:to-warning-700 rounded-full w-20"></div>
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-2/3"></div>
      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded w-1/2"></div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
      <div className="h-8 bg-gradient-to-r from-success-200 to-success-300 dark:from-success-700 dark:to-success-800 rounded-lg w-1/3"></div>
    </div>
  </div>
);

const EnhancedRealEstateDashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Loading State
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
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
  const [filterPriceRange, setFilterPriceRange] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterReferralType, setFilterReferralType] = useState('all');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Sort order - newest or oldest first
  // Sort State - combined into single object to avoid state sync issues
  const [sortState, setSortState] = useState(() => {
    return {
      order: localStorage.getItem('transactionSortOrder') || 'newest',
      version: 0
    };
  });
  
  const sortOrder = sortState.order;
  const sortVersion = sortState.version;
  
  // Logo State
  const [customLogo, setCustomLogo] = useState(() => {
    return localStorage.getItem('customLogo') || '/assets/logos/app-logo-default.png';
  });
  
  // Agent Customization State
  const [agentName, setAgentName] = useState(() => {
    return localStorage.getItem('agentName') || '';
  });
  
  const [agentCompany, setAgentCompany] = useState(() => {
    return localStorage.getItem('agentCompany') || '';
  });
  
  // Commission Sheet Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  
  // Form Data State
  const [formData, setFormData] = useState({
    // Basic Info
    propertyType: 'Residential',
    clientType: 'Seller',
    transactionType: 'Sale', // NEW: Sale, Referral $ Received, Referral $ Paid
    source: '',
    address: '',
    city: '',
    listPrice: '',
    closedPrice: '',
    listDate: '',
    closingDate: '',
    status: 'Closed',
    
    // Referral Fields (NEW)
    referringAgent: '', // Name of agent you referred to/from
    referralFeeReceived: '', // For Referral $ Received - fee you receive
    
    // Commission Fields
    brokerage: 'Keller Williams',
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
    
    // Handle keyboard shortcuts
    const handleKeyboardShortcuts = (e) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + N: Add Transaction (New)
      if (cmdKey && e.key === 'n') {
        e.preventDefault();
        resetForm();
        setShowForm(true);
        return;
      }
      
      // Cmd/Ctrl + R: Sync (Refresh)
      if (cmdKey && e.key === 'r') {
        e.preventDefault();
        if (isGoogleSheetsEnabled) {
          syncNow();
        }
        return;
      }
      
      // Cmd/Ctrl + ,: Settings
      if (cmdKey && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
        return;
      }
      
      // Esc: Close modals
      if (e.key === 'Escape') {
        closeViewModal();
        resetForm();
        setShowSettings(false);
        return;
      }
      
      // /: Focus search/filter
      if (e.key === '/' && !cmdKey) {
        e.preventDefault();
        // Focus the search input
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
          searchInput.focus();
          setIsSearchFocused(true);
        }
        return;
      }
    };
    
    window.addEventListener('googleAuthSuccess', handleOAuthSuccess);
    window.addEventListener('keydown', handleKeyboardShortcuts);
    
    return () => {
      window.removeEventListener('googleAuthSuccess', handleOAuthSuccess);
      window.removeEventListener('keydown', handleKeyboardShortcuts);
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
        
        // Auto-sync on app open
        console.log('🔄 Auto-syncing on app startup...');
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
    } finally {
      // End loading state after data is loaded
      setTimeout(() => setIsInitialLoading(false), 500); // Small delay for smooth transition
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
      transactionType = 'Sale',
      closedPrice = 0,
      commissionPct = 0,
      referralPct = 0,
      referralFeeReceived = 0, // NEW: For Referral $ Received transactions
      
      // KW fields
      eo = 0,
      royalty = '', // Manual override
      companyDollar = '', // Manual override
      hoaTransfer = 0,
      homeWarranty = 0,
      kwCares = 0,
      kwNextGen = 0,
      boldScholarship = 0,
      tcConcierge = 0,
      jelmbergTeam = 0,
      
      // BDH fields
      bdhSplitPct = 0,
      preSplitDeduction = '', // Manual override
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
    const refFeeReceived = parseFloat(referralFeeReceived) || 0;

    let gci, referralDollar, adjustedGci;

    // REFERRAL $ RECEIVED: You refer client to another agent, receive referral fee
    if (transactionType === 'Referral $ Received') {
      gci = refFeeReceived; // GCI is the referral fee itself
      referralDollar = 0; // You're not paying a referral
      adjustedGci = gci; // No adjustment needed
    } 
    // REGULAR SALE or REFERRAL $ PAID: Calculate from property price
    else {
      // Calculate GCI (Gross Commission Income)
      gci = price * (commPct / 100);
      
      // Calculate Referral Dollar if referral percentage is provided
      referralDollar = refPct > 0 ? gci * (refPct / 100) : 0;
      
      // Calculate Adjusted GCI (after referral)
      adjustedGci = gci - referralDollar;
    }

    let totalBrokerageFees = 0;
    let nci = 0;

    if (brokerage === 'KW') {
      // KW Commission Calculation
      // Use manual values if provided, otherwise calculate
      const royaltyValue = royalty !== '' && royalty !== null && royalty !== undefined 
        ? parseFloat(royalty) 
        : adjustedGci * 0.06; // 6% of Adjusted GCI
      const companyDollarValue = companyDollar !== '' && companyDollar !== null && companyDollar !== undefined 
        ? parseFloat(companyDollar) 
        : adjustedGci * 0.10; // 10% of Adjusted GCI
      
      totalBrokerageFees = 
        (parseFloat(eo) || 0) +
        royaltyValue +
        companyDollarValue +
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
        royalty: royaltyValue.toFixed(2),
        companyDollar: companyDollarValue.toFixed(2),
        totalBrokerageFees: totalBrokerageFees.toFixed(2),
        nci: nci.toFixed(2),
        netVolume: price.toFixed(2)
      };
    } else if (brokerage === 'BDH') {
      // BDH Commission Calculation
      const splitPct = parseFloat(bdhSplitPct) || 94; // Default 94%
      // Use manual value if provided, otherwise calculate
      const preSplitDeductionValue = preSplitDeduction !== '' && preSplitDeduction !== null && preSplitDeduction !== undefined 
        ? parseFloat(preSplitDeduction) 
        : adjustedGci * 0.06; // 6% pre-split deduction
      const afterPreSplit = adjustedGci - preSplitDeductionValue;
      const agentSplit = afterPreSplit * (splitPct / 100);
      
      totalBrokerageFees = 
        preSplitDeductionValue +
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
        preSplitDeduction: preSplitDeductionValue.toFixed(2),
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
    
    // List of manually editable calculated fields
    const manuallyEditedFields = ['gci', 'referralDollar', 'adjustedGci', 'royalty', 'companyDollar', 'preSplitDeduction', 'totalBrokerageFees', 'nci'];
    
    // If user is directly editing a calculated field, don't auto-calculate it
    const isManualEdit = manuallyEditedFields.includes(name);
    
    // Bidirectional GCI / Commission % calculation
    if (name === 'gci' && value && newFormData.closedPrice) {
      // If user enters GCI, calculate commission %
      const gciValue = parseFloat(value) || 0;
      const closedPrice = parseFloat(newFormData.closedPrice) || 0;
      if (closedPrice > 0) {
        newFormData.commissionPct = ((gciValue / closedPrice) * 100).toFixed(2);
      }
    }
    
    // Bidirectional Referral $ / Referral % calculation
    if (name === 'referralDollar' && value && newFormData.gci) {
      // If user enters referral $, calculate referral %
      const referralDollar = parseFloat(value) || 0;
      const gci = parseFloat(newFormData.gci) || 0;
      if (gci > 0) {
        newFormData.referralPct = ((referralDollar / gci) * 100).toFixed(2);
      }
    }
    
    // Auto-calculate if relevant fields change (but NOT if user is manually editing a calculated field)
    if (!isManualEdit && ['closedPrice', 'commissionPct', 'referralPct', 'brokerage', 'referralFeeReceived', 'transactionType'].includes(name)) {
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
    
    // If user manually edits deduction fields (E&O, HOA, etc.), recalculate only totalBrokerageFees and NCI
    const deductionFields = ['eo', 'hoaTransfer', 'homeWarranty', 'kwCares', 'kwNextGen', 'boldScholarship', 'tcConcierge', 'jelmbergTeam', 'otherDeductions', 'buyersAgentSplit', 'asf', 'foundation10', 'adminFee', 'bdhSplitPct'];
    if (deductionFields.includes(name)) {
      const calculated = calculateCommission(newFormData);
      // Only update totalBrokerageFees and NCI if they haven't been manually edited
      newFormData.totalBrokerageFees = calculated.totalBrokerageFees;
      newFormData.nci = calculated.nci;
      
      // Also update auto-calculated intermediate values
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
    if (window.confirm('Remove custom logo and restore default?')) {
      setCustomLogo('/assets/logos/app-logo-default.png');
      localStorage.removeItem('customLogo');
    }
  };

  // ==================== COMMISSION SHEET SCANNER ====================
  
  const handleScanCommissionSheet = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type - OpenAI Vision only supports images, not PDFs
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      if (file.type === 'application/pdf') {
        setScanError('PDFs not supported yet. Please take a screenshot of the PDF and upload the image instead. (JPG, PNG, WebP)');
      } else {
        setScanError('Please upload an image file (JPG, PNG, WebP)');
      }
      return;
    }

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setScanError('File size must be less than 20MB');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;

          // Call our serverless function
          const response = await fetch('/api/scan-commission-sheet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64Image
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to scan commission sheet');
          }

          const result = await response.json();
          
          if (result.success && result.data) {
            // Auto-fill form with extracted data
            const extracted = result.data;
            
            setFormData(prev => ({
              ...prev,
              // Only update fields that were successfully extracted (not null)
              ...(extracted.transactionType && { transactionType: extracted.transactionType }),
              ...(extracted.propertyType && { propertyType: extracted.propertyType }),
              ...(extracted.clientType && { clientType: extracted.clientType }),
              ...(extracted.address && { address: extracted.address }),
              ...(extracted.city && { city: extracted.city }),
              ...(extracted.listPrice && { listPrice: extracted.listPrice.toString() }),
              ...(extracted.closedPrice && { closedPrice: extracted.closedPrice.toString() }),
              ...(extracted.listDate && { listDate: extracted.listDate }),
              ...(extracted.closingDate && { closingDate: extracted.closingDate }),
              ...(extracted.brokerage && { brokerage: extracted.brokerage }),
              ...(extracted.commissionPct && { commissionPct: extracted.commissionPct.toString() }),
              ...(extracted.gci && { gci: extracted.gci.toString() }),
              ...(extracted.referralPct && { referralPct: extracted.referralPct.toString() }),
              ...(extracted.referralDollar && { referralDollar: extracted.referralDollar.toString() }),
              ...(extracted.adjustedGci && { adjustedGci: extracted.adjustedGci.toString() }),
              ...(extracted.totalBrokerageFees && { totalBrokerageFees: extracted.totalBrokerageFees.toString() }),
              ...(extracted.nci && { nci: extracted.nci.toString() }),
              ...(extracted.status && { status: extracted.status }),
              ...(extracted.referringAgent && { referringAgent: extracted.referringAgent }),
              ...(extracted.referralFeeReceived && { referralFeeReceived: extracted.referralFeeReceived.toString() }),
            }));

            // Show success message
            alert(`✅ Commission sheet scanned successfully!\n\nConfidence: ${extracted.confidence}%\n\nPlease review the auto-filled data before saving.`);
          } else {
            throw new Error('No data extracted from commission sheet');
          }
        } catch (error) {
          console.error('Scan error:', error);
          setScanError(error.message);
        } finally {
          setIsScanning(false);
          // Reset file input
          event.target.value = '';
        }
      };

      reader.onerror = () => {
        setScanError('Failed to read file');
        setIsScanning(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error.message);
      setIsScanning(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyType: 'Residential',
      clientType: 'Seller',
      transactionType: 'Sale',
      source: '',
      address: '',
      city: '',
      listPrice: '',
      closedPrice: '',
      listDate: '',
      closingDate: '',
      status: 'Closed',
      referringAgent: '',
      referralFeeReceived: '',
      brokerage: 'Keller Williams',
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

  // ==================== METRIC CARD INTERACTIONS ====================
  
  const handleMetricCardClick = (metricType) => {
    // Simply scroll to transactions list - don't change state
    // Following "Law of Locality" - guide user's attention, don't manipulate data
    
    // Special case: Referral Fees cards should filter to show only referral transactions
    if (metricType === 'referralPaid' || metricType === 'referralReceived') {
      // Filter to show only referral transactions
      setFilterClientType('all');
      setFilterBrokerage('all');
      setFilterPropertyType('all');
      setFilterPriceRange('all');
      setFilterDateRange('all');
      setFilterYear('all');
      setFilterReferralType('referralOnly');
    }
    
    setTimeout(() => {
      const transactionsList = document.getElementById('transactions-list');
      if (transactionsList) {
        transactionsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // ==================== FILTERING & SORTING ====================
  
  // Compute filtered and sorted transactions
  const computeFilteredTransactions = () => {
    const filtered = transactions.filter(transaction => {
      const year = transaction.closingDate ? new Date(transaction.closingDate).getFullYear().toString() : '';
      
      if (filterYear !== 'all' && year !== filterYear) return false;
      if (filterClientType !== 'all' && transaction.clientType !== filterClientType) return false;
      
      // Handle both full names and abbreviations for brokerage filter
      if (filterBrokerage !== 'all') {
        const brokerageName = transaction.brokerage || '';
        const matchesFilter = 
          brokerageName === filterBrokerage || 
          (filterBrokerage === 'KW' && brokerageName === 'Keller Williams') ||
          (filterBrokerage === 'BDH' && brokerageName === 'Bennion Deville Homes');
        if (!matchesFilter) return false;
      }
      
      if (filterPropertyType !== 'all' && transaction.propertyType !== filterPropertyType) return false;
      
      // Price range filter
      if (filterPriceRange !== 'all') {
        const price = parseFloat(transaction.closedPrice) || 0;
        switch (filterPriceRange) {
          case 'under500k':
            if (price >= 500000) return false;
            break;
          case '500k-1m':
            if (price < 500000 || price >= 1000000) return false;
            break;
          case '1m-2m':
            if (price < 1000000 || price >= 2000000) return false;
            break;
          case 'over2m':
            if (price < 2000000) return false;
            break;
        }
      }
      
      // Date range filter
      if (filterDateRange !== 'all') {
        const closingDate = transaction.closingDate ? new Date(transaction.closingDate) : null;
        if (!closingDate) return false;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filterDateRange) {
          case '3months':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            if (closingDate < threeMonthsAgo) return false;
            break;
          case '6months':
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            if (closingDate < sixMonthsAgo) return false;
            break;
          case '12months':
            const twelveMonthsAgo = new Date(today);
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            if (closingDate < twelveMonthsAgo) return false;
            break;
          case 'ytd':
            const yearStart = new Date(today.getFullYear(), 0, 1);
            if (closingDate < yearStart) return false;
            break;
          case 'lastYear':
            const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
            if (closingDate < lastYearStart || closingDate > lastYearEnd) return false;
            break;
        }
      }
      
      // Referral type filter
      if (filterReferralType !== 'all') {
        const hasReferralPaid = parseFloat(transaction.referralDollar) > 0;
        const hasReferralReceived = parseFloat(transaction.referralFeeReceived) > 0;
        const hasAnyReferralActivity = hasReferralPaid || hasReferralReceived;
        
        switch (filterReferralType) {
          case 'referralOnly':
            if (!hasAnyReferralActivity) return false;
            break;
          case 'referralReceived':
            if (!hasReferralReceived) return false;
            break;
          case 'referralPaid':
            if (!hasReferralPaid) return false;
            break;
          case 'regularOnly':
            if (hasAnyReferralActivity) return false;
            break;
        }
      }
      
      // Search functionality - fuzzy search across multiple fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          transaction.address || '',
          transaction.city || '',
          transaction.source || '',
          transaction.referringAgent || '',
          transaction.propertyType || '',
          transaction.brokerage || '',
          transaction.status || ''
        ];
        
        // Check if any field contains the search query (fuzzy matching)
        const matchesSearch = searchableFields.some(field => 
          field.toLowerCase().includes(query)
        );
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
    
    // Create a NEW array (don't mutate) and sort it
    const sorted = [...filtered].sort((a, b) => {
      // Sort by closing date - handle empty/invalid dates
      const dateA = a.closingDate ? new Date(a.closingDate) : new Date(0);
      const dateB = b.closingDate ? new Date(b.closingDate) : new Date(0);
      
      // Check if dates are valid
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      
      // Newest first (descending) or oldest first (ascending)
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
    
    return sorted;
  };
  
  const filteredTransactions = computeFilteredTransactions();
  
  // Create a brand new array reference to force React to see it as different
  const displayTransactions = React.useMemo(() => {
    // Map to completely new objects so React sees them as different
    return filteredTransactions.map((t, idx) => ({
      ...t,
      _displayKey: `${sortVersion}-${idx}`
    }));
  }, [filteredTransactions, sortVersion]);
  
  // Toggle sort order function
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    
    // Update BOTH order and version in a single state update
    setSortState(prev => ({
      order: newOrder,
      version: prev.version + 1
    }));
    
    localStorage.setItem('transactionSortOrder', newOrder);
  };

  // ==================== METRICS ====================
  
  const metrics = {
    totalGCI: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.gci) || 0), 0),
    totalNCI: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0),
    avgCommission: filteredTransactions.length > 0 
      ? filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) / filteredTransactions.length 
      : 0,
    totalVolume: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.closedPrice) || 0), 0),
    referralFeesPaid: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.referralDollar) || 0), 0),
    referralFeesReceived: filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.referralFeeReceived) || 0), 0)
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
        color: 'from-warning-400 to-warning-600'
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
        color: 'from-info-400 to-info-600'
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
        color: 'from-primary-400 to-referral-500'
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
      color: strongerSide === 'Buyers' ? 'from-info-400 to-info-600' : 'from-warning-400 to-warning-600'
    });
    
    // Highest single commission
    const highestDeal = filteredTransactions.sort((a, b) => (parseFloat(b.nci) || 0) - (parseFloat(a.nci) || 0))[0];
    if (highestDeal) {
      insights.push({
        icon: '💎',
        label: 'Biggest Deal',
        value: `$${parseFloat(highestDeal.nci).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtext: highestDeal.address,
        color: 'from-success-400 to-success-600'
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
    { 
      name: 'KW', 
      value: filteredTransactions.filter(t => 
        t.brokerage === 'KW' || t.brokerage === 'Keller Williams'
      ).reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) 
    },
    { 
      name: 'BDH', 
      value: filteredTransactions.filter(t => 
        t.brokerage === 'BDH' || t.brokerage === 'Bennion Deville Homes'
      ).reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0) 
    }
  ].filter(item => item.value > 0); // Only show brokerages with data

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // ==================== EXPORT ====================
  
  const exportToCSV = () => {
    const headers = [
      'Property Type', 'Client Type', 'Transaction Type', 'Source', 'Address', 'City', 
      'List Price', 'Closed Price', 'List Date', 'Closing Date',
      'Brokerage', 'Commission %', 'GCI', 'Referral %', 'Referral $',
      'Adjusted GCI', 'Pre-Split Deduction', 'Total Brokerage Fees', 'NCI', 
      'Status', 'Assistant Bonus', 'Buyers Agent Split',
      'Referring Agent', 'Referral Fee Received', 'Net Volume'
    ];

    const rows = filteredTransactions.map(t => [
      t.propertyType,
      t.clientType,
      t.transactionType || 'Sale',
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
      t.preSplitDeduction || 0,
      t.totalBrokerageFees,
      t.nci,
      t.status,
      t.assistantBonus || 0,
      t.buyersAgentSplit || 0,
      t.referringAgent || '',
      t.referralFeeReceived || 0,
      t.netVolume || 0
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
        {/* Brand Layer - Primary Header */}
        <div className="relative overflow-visible rounded-2xl mb-8 shadow-2xl">
          {/* Rich Matte Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
          
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 opacity-10 rounded-2xl" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)`
          }}></div>
          
          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              {/* Left: Brand Identity */}
              <div className="flex items-center gap-6">
                {/* Logo with Subtle Drop Shadow */}
                <div className="relative">
                  {customLogo ? (
                    <img 
                      src={customLogo} 
                      alt="Dashboard Logo" 
                      className="w-20 h-20 rounded-2xl shadow-2xl object-cover border-2 border-white/20"
                      style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-2xl" style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-white font-bold text-2xl">JG</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-white shadow-md"></div>
                </div>
                
                {/* Brand Text */}
                <div>
                  <h1 className="text-4xl font-semibold text-white mb-1 tracking-tight">
                    Commission Dashboard
                  </h1>
                  <p className="text-slate-300 text-lg font-medium tracking-wide">
                    {agentName && agentCompany ? `${agentName} • ${agentCompany}` : agentName ? agentName : agentCompany ? agentCompany : 'Manage your real estate commissions'}
                  </p>
                </div>
              </div>

              {/* Right: Brand Utilities */}
              <div className="flex items-center gap-3">
                {/* Sync Button */}
                {isGoogleSheetsEnabled && isGoogleSheetsAuthorized ? (
                  <button
                    onClick={syncNow}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:border-2 hover:border-success-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    title="Sync with Google Sheets (⌘R)"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Sync</span>
                    <span className="text-xs opacity-75">⌘R</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <CloudOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</span>
                  </div>
                )}

                {/* Info Tooltip */}
                <div className="group relative">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
                    <div className="w-5 h-5 text-white">ⓘ</div>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Data Source:</strong> Google Sheets integration<br/>
                      <strong>Last Sync:</strong> {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}<br/>
                      <strong>Auto-sync:</strong> Every 5 minutes when active
                    </p>
                  </div>
                </div>

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
                  title="Settings (⌘,)"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Error Display */}
        {syncError && (
          <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <p className="text-xs text-danger-700 dark:text-danger-300 font-medium flex-1">{syncError}</p>
            <div className="flex items-center gap-2">
              {syncError.includes('Session expired') && (
                <button
                  onClick={enableGoogleSheets}
                  className="text-xs bg-info-600 hover:bg-info-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign In Again
                </button>
              )}
              <button
                onClick={() => setSyncError(null)}
                className="text-xs text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Control Layer - Filter & Search Panel */}
        <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl hover:shadow-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Search Transactions</h3>
            <div className="ml-auto text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
              {filteredTransactions.length} of {transactions.length} shown
            </div>
          </div>

          {/* Search Field - Search-First Focus */}
          <div className="mb-6">
            <div className="relative">
              <input
                id="global-search"
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full px-4 py-3 pl-10 pr-4 rounded-xl border-2 transition-all duration-200 ${
                  isSearchFocused 
                    ? 'border-primary-500 bg-white dark:bg-gray-800 shadow-md' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                autoFocus
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-4 h-4 text-gray-400 dark:text-gray-500">🔍</div>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Organized Filter Groups */}
          <div className="space-y-6">
            {/* Time Range Group */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 flex items-center gap-1">
                <span className="text-base">📅</span> Time
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Time</option>
                  <option value="3months">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="12months">12 Months</option>
                  <option value="ytd">YTD</option>
                  <option value="lastYear">Last Year</option>
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Years</option>
                  {[...new Set(transactions.map(t => t.closingDate ? new Date(t.closingDate).getFullYear() : null))].filter(Boolean).sort((a, b) => b - a).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories Group */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 flex items-center gap-1">
                <span className="text-base">🏷️</span> Type
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterClientType}
                  onChange={(e) => setFilterClientType(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Types</option>
                  <option value="Buyer">🔵 Buyers</option>
                  <option value="Seller">⭐ Sellers</option>
                </select>
                <select
                  value={filterBrokerage}
                  onChange={(e) => setFilterBrokerage(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Brokerages</option>
                  <option value="KW">KW</option>
                  <option value="BDH">BDH</option>
                </select>
                <select
                  value={filterPropertyType}
                  onChange={(e) => setFilterPropertyType(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Properties</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                </select>
                <select
                  value={filterReferralType}
                  onChange={(e) => setFilterReferralType(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md"
                >
                  <option value="all">All Transactions</option>
                  <option value="regularOnly">Regular</option>
                  <option value="referralOnly">Referral</option>
                  <option value="referralReceived">Received</option>
                  <option value="referralPaid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(filterYear !== 'all' || filterClientType !== 'all' || filterBrokerage !== 'all' || filterPropertyType !== 'all' || filterReferralType !== 'all' || filterDateRange !== 'all' || searchQuery.trim()) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterDateRange !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Time: {filterDateRange === '3months' ? '3 Months' : filterDateRange === '6months' ? '6 Months' : filterDateRange === '12months' ? '12 Months' : filterDateRange === 'ytd' ? 'YTD' : filterDateRange === 'lastYear' ? 'Last Year' : filterDateRange}
                    <button
                      onClick={() => setFilterDateRange('all')}
                      className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterYear !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Year: {filterYear}
                    <button
                      onClick={() => setFilterYear('all')}
                      className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterClientType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Type: {filterClientType === 'Buyer' ? '🔵 Buyers' : '⭐ Sellers'}
                    <button
                      onClick={() => setFilterClientType('all')}
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterBrokerage !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Brokerage: {filterBrokerage}
                    <button
                      onClick={() => setFilterBrokerage('all')}
                      className="ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterPropertyType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Property: {filterPropertyType}
                    <button
                      onClick={() => setFilterPropertyType('all')}
                      className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterReferralType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Referral: {filterReferralType === 'regularOnly' ? 'Regular' : filterReferralType === 'referralOnly' ? 'Referral' : filterReferralType === 'referralReceived' ? 'Received' : 'Paid'}
                    <button
                      onClick={() => setFilterReferralType('all')}
                      className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterYear('all');
                    setFilterClientType('all');
                    setFilterBrokerage('all');
                    setFilterPropertyType('all');
                    setFilterReferralType('all');
                    setFilterDateRange('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {isInitialLoading ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              {/* Gross Commission Income */}
              <button 
                onClick={handleMetricCardClick}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group animate-[fadeIn_0.6s_ease-out] w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(215, 70%, 45%) 0%, hsl(215, 65%, 55%) 100%)',
                  border: '2px solid hsl(215, 80%, 60%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>💰 Gross Commission</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.totalGCI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Total earned before fees</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <DollarSign className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>

              {/* Net Commission Income */}
              <button
                onClick={handleMetricCardClick}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(150, 60%, 40%) 0%, hsl(150, 55%, 50%) 100%)',
                  border: '2px solid hsl(150, 70%, 55%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>✅ Net Commission</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.totalNCI.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Your take-home pay</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <TrendingUp className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>

              {/* Total Sales Volume */}
              <button
                onClick={handleMetricCardClick}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(200, 60%, 50%) 0%, hsl(200, 55%, 60%) 100%)',
                  border: '2px solid hsl(200, 70%, 65%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>🏘️ Total Sales Volume</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Combined property value</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <Home className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>

              {/* Average Commission */}
              <button
                onClick={handleMetricCardClick}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(265, 55%, 40%) 0%, hsl(265, 50%, 50%) 100%)',
                  border: '2px solid hsl(265, 65%, 55%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>📊 Average Per Deal</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.avgCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Average commission earned</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <TrendingUp className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>

              {/* Referral Fees Paid */}
              <button
                onClick={() => handleMetricCardClick('referralPaid')}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group animate-[fadeIn_0.6s_ease-out] w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(25, 50%, 40%) 0%, hsl(25, 45%, 50%) 100%)',
                  border: '2px solid hsl(25, 60%, 55%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>💸 Referral Fees Paid</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.referralFeesPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Paid to referral partners</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <DollarSign className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>

              {/* Referral Fees Received */}
              <button
                onClick={() => handleMetricCardClick('referralReceived')}
                className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl p-8 text-white transform hover:-translate-y-2 hover:scale-105 transition-all duration-700 backdrop-blur-sm group animate-[fadeIn_0.6s_ease-out] w-full text-left cursor-pointer active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, hsl(145, 65%, 45%) 0%, hsl(145, 60%, 55%) 100%)',
                  border: '2px solid hsl(145, 75%, 60%)',
                  boxShadow: '0 8px 32px hsla(0, 0%, 25%, 0.3)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/95 text-sm font-semibold uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>💰 Referral Fees Received</p>
                    <p className="text-4xl font-bold mt-2 mb-2" style={{ color: 'hsl(0, 0%, 98%)', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>${metrics.referralFeesReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-white/85 text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>Received from referral partners</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <DollarSign className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {isInitialLoading ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : (
            <>
          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-[fadeIn_0.7s_ease-out]">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Monthly Income Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#E5E7EB' }} stroke="#E5E7EB" />
                <YAxis tick={{ fontSize: 12, fill: '#E5E7EB' }} stroke="#E5E7EB" />
                <Tooltip content={<TahoeTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="gci" stroke="#FBBF24" strokeWidth={4} name="Gross Commission" />
                <Line type="monotone" dataKey="nci" stroke="#34D399" strokeWidth={4} name="Net Commission" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Transactions by Month</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#E5E7EB' }} stroke="#E5E7EB" />
                <YAxis tick={{ fontSize: 12, fill: '#E5E7EB' }} stroke="#E5E7EB" />
                <Tooltip content={<TahoeTooltip />} />
                <Legend />
                <Bar dataKey="transactions" fill="#60A5FA" name="Transactions" radius={[8, 8, 0, 0]} />
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
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TahoeTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-[fadeIn_0.7s_ease-out]">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Income by Brokerage</h3>
            {brokerageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brokerageData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 14, fill: '#9CA3AF' }} 
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<TahoeTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    name="Net Commission Income" 
                    radius={[8, 8, 0, 0]}
                    label={{ position: 'top', fill: '#9CA3AF', fontSize: 12, formatter: (value) => `$${(value / 1000).toFixed(1)}k` }}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">No brokerage data available</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Smart Insights */}
        {smartInsights.length > 0 && (
          <div className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-[fadeIn_0.8s_ease-out]">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-primary p-4 rounded-xl">
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
                  <div className="text-4xl mb-4">{insight.icon}</div>
                  <div className="space-y-2">
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

        {/* Transactions List */}
        <div id="transactions-list" key={`transaction-list-${sortVersion}`} className="glass-morphism bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-8 transition-all duration-700 border border-white/30 dark:border-gray-700/30 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-bold dark:text-white">
              Filtered Transactions
              {filteredTransactions.length > 0 && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                  ({filteredTransactions.length} total)
                </span>
              )}
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Add Transaction Button - Near Transactions */}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, hsl(250, 60%, 50%) 0%, hsl(250, 55%, 60%) 100%)',
                  border: '2px solid hsl(250, 70%, 65%)',
                  boxShadow: '0 4px 16px hsla(0, 0%, 25%, 0.2)'
                }}
                title="Add Transaction (⌘N)"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
                <span className="hidden lg:inline text-xs opacity-75 ml-1">⌘N</span>
              </button>

              {filteredTransactions.length > 0 && (
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-300 rounded-lg hover:bg-info-100 dark:hover:bg-info-900/50 transition-all font-medium border border-info-200 dark:border-info-800 shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{sortOrder === 'newest' ? 'Newest First ↓' : 'Oldest First ↑'}</span>
                </button>
              )}
            </div>
          </div>

          {isInitialLoading ? (
            <div className="space-y-4">
              <SkeletonTransactionCard />
              <SkeletonTransactionCard />
              <SkeletonTransactionCard />
            </div>
          ) : filteredTransactions.length === 0 ? (
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
            <div className="space-y-4 animate-[fadeIn_0.8s_ease-out]">
              {displayTransactions.map((transaction, index) => {
                const isBuyer = transaction.clientType === 'Buyer';
                const isReferralOut = transaction.transactionType === 'Referral $ Received';
                const isReferralIn = transaction.transactionType === 'Referral $ Paid';
                const isReferral = isReferralOut || isReferralIn;
                
                return (
                <div
                  key={transaction._displayKey}
                  onClick={() => handleView(transaction)}
                  className={`flex items-center justify-between p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer border-2 ${
                    isReferral
                      ? 'bg-referral-50 dark:bg-referral-950 border-referral-300 dark:border-referral-700 hover:border-referral-500 dark:hover:border-referral-500'
                      : isBuyer
                        ? 'bg-info-50 dark:bg-info-950 border-info-300 dark:border-info-700 hover:border-info-500 dark:hover:border-info-500'
                        : 'bg-warning-50 dark:bg-warning-950 border-warning-300 dark:border-warning-700 hover:border-warning-500 dark:hover:border-warning-500'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={`font-bold text-lg truncate ${
                          isReferral
                            ? 'text-referral-900 dark:text-referral-100'
                            : isBuyer 
                              ? 'text-info-900 dark:text-info-100' 
                              : 'text-warning-900 dark:text-warning-100'
                        }`}>{transaction.address}</h3>
                        
                        {/* Referral Badge */}
                        {isReferral && (
                          <span className="px-4 py-2 rounded-full text-xs font-bold shadow-md border-2 bg-referral-100 dark:bg-referral-900/50 text-referral-800 dark:text-referral-200 border-referral-300 dark:border-referral-600">
                            {isReferralOut ? '💰 Referral $ Received' : '💸 Referral $ Paid'}
                          </span>
                        )}
                        
                        <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-md border-2 ${
                          isBuyer
                            ? 'bg-info-600 text-white border-info-700 dark:bg-info-500 dark:border-info-400' 
                            : 'bg-warning-600 text-gray-900 border-warning-700 dark:bg-warning-500 dark:border-warning-400'
                        }`}>
                          {isBuyer ? '🔵 ' : '⭐ '}{transaction.clientType}
                        </span>
                        <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm border ${
                          isBuyer
                            ? 'bg-info-100 dark:bg-info-800 text-info-800 dark:text-info-100 border-info-300 dark:border-info-600'
                            : 'bg-warning-100 dark:bg-warning-800 text-warning-900 dark:text-warning-100 border-warning-300 dark:border-warning-600'
                        }`}>
                          {transaction.brokerage === 'KW' || transaction.brokerage === 'Keller Williams' ? 'Keller Williams' : 'Bennion Deville Homes'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">📍</span>
                          {transaction.city}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">💰</span>
                          ${parseFloat(transaction.closedPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">📅</span>
                          {new Date(transaction.closingDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={`text-right px-4 py-4 rounded-lg shadow-md border-2 w-[140px] ${
                      isReferral
                        ? 'bg-gradient-to-br from-success-50 to-referral-50 dark:from-success-900/50 dark:to-referral-900/50 border-success-300 dark:border-success-600'
                        : isBuyer
                          ? 'bg-gradient-to-br from-success-50 to-info-50 dark:from-success-900/50 dark:to-info-900/50 border-success-300 dark:border-success-600'
                          : 'bg-gradient-to-br from-success-50 to-warning-50 dark:from-success-900/50 dark:to-warning-900/50 border-success-300 dark:border-success-600'
                    }`}>
                      <p className="text-xs text-success-700 dark:text-success-300 font-semibold uppercase tracking-wide">💵 NCI</p>
                      <p className="text-xl font-bold text-success-700 dark:text-success-200">
                        ${parseFloat(transaction.nci || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-4 text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/30 hover:bg-info-100 dark:hover:bg-info-900/50 rounded-lg transition-all shadow-sm hover:shadow-md"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-4 text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900/50 rounded-lg transition-all shadow-sm hover:shadow-md"
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
          Commission Dashboard v3.15.0 • Built with ❤️ by Dana Dube
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
                {/* AI Commission Sheet Scanner */}
                <div className="mb-6 p-6 bg-gradient-to-r from-primary-50 to-info-50 dark:from-primary-900/20 dark:to-info-900/20 rounded-2xl border-2 border-primary-200 dark:border-primary-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">🤖</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100">AI Commission Sheet Scanner</h3>
                      <p className="text-sm text-primary-700 dark:text-primary-300">Upload a screenshot or image to auto-fill this form</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScanCommissionSheet}
                        disabled={isScanning}
                        className="hidden"
                        id="commission-sheet-upload"
                      />
                      <div className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all cursor-pointer ${
                        isScanning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      }`}>
                        {isScanning ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span>📷 Scan Commission Sheet</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  
                  {scanError && (
                    <div className="mt-4 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                      <p className="text-sm text-danger-700 dark:text-danger-300">❌ {scanError}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-primary-600 dark:text-primary-400">
                    <p>✨ Supports: KW & BDH commission sheets • JPG, PNG, WebP • Max 20MB</p>
                    <p className="mt-2">🎯 Auto-detects: Transaction type, amounts, dates, and all fields</p>
                    <p className="mt-2">💡 Tip: For PDFs, take a screenshot first (Cmd+Shift+4 on Mac)</p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Property Type *</label>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Land">Land</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Client Type *</label>
                      <select
                        name="clientType"
                        value={formData.clientType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Buyer">Buyer</option>
                        <option value="Seller">Seller</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Transaction Type *</label>
                      <select
                        name="transactionType"
                        value={formData.transactionType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Sale">💼 Regular Sale</option>
                        <option value="Referral $ Received">💰 Referral $ Received (You refer TO another agent)</option>
                        <option value="Referral $ Paid">💸 Referral $ Paid (You receive FROM another agent)</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.transactionType === 'Sale' && '→ Standard buyer/seller transaction'}
                        {formData.transactionType === 'Referral $ Received' && '→ You send client to another agent, receive referral fee'}
                        {formData.transactionType === 'Referral $ Paid' && '→ Another agent sends you a client, you pay referral fee'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Source</label>
                      <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                        placeholder="e.g., Referral, Zillow, Sign Call"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Referral-Specific Fields */}
                    {(formData.transactionType === 'Referral $ Received' || formData.transactionType === 'Referral $ Paid') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {formData.transactionType === 'Referral $ Received' ? 'Referring Agent (Who you sent client to)' : 'Referring Agent (Who sent you the client)'}
                          </label>
                          <input
                            type="text"
                            name="referringAgent"
                            value={formData.referringAgent}
                            onChange={handleInputChange}
                            placeholder="Agent Name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        {formData.transactionType === 'Referral $ Received' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Referral Fee Received *
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Total fee you receive)</span>
                            </label>
                            <input
                              type="number"
                              name="referralFeeReceived"
                              value={formData.referralFeeReceived}
                              onChange={handleInputChange}
                              step="0.01"
                              placeholder="0.00"
                              required={formData.transactionType === 'Referral $ Received'}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Brokerage *</label>
                      <select
                        name="brokerage"
                        value={formData.brokerage}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Keller Williams">Keller Williams (KW)</option>
                        <option value="Bennion Deville Homes">Bennion Deville Homes (BDH)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="123 Main St"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Palm Desert"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Only show List/Closed Price for regular sales */}
                    {formData.transactionType === 'Sale' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">List Price</label>
                          <input
                            type="number"
                            name="listPrice"
                            value={formData.listPrice}
                            onChange={handleInputChange}
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Closed Price *</label>
                          <input
                            type="number"
                            name="closedPrice"
                            value={formData.closedPrice}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    {/* For Referral In, still show prices since Janice sold the property */}
                    {formData.transactionType === 'Referral In' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">List Price</label>
                          <input
                            type="number"
                            name="listPrice"
                            value={formData.listPrice}
                            onChange={handleInputChange}
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Closed Price *</label>
                          <input
                            type="number"
                            name="closedPrice"
                            value={formData.closedPrice}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">List Date</label>
                      <input
                        type="date"
                        name="listDate"
                        value={formData.listDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Closing Date *</label>
                      <input
                        type="date"
                        name="closingDate"
                        value={formData.closingDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission Fields */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Commission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Commission % *</label>
                      <input
                        type="number"
                        name="commissionPct"
                        value={formData.commissionPct}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        placeholder="3.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Referral %</label>
                      <input
                        type="number"
                        name="referralPct"
                        value={formData.referralPct}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Gross Commission Income (GCI)
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">✏️ Editable - auto-calculates Commission %</span>
                      </label>
                      <input
                        type="number"
                        name="gci"
                        value={formData.gci}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Referral Fee Paid ($)
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">✏️ Editable - auto-calculates Referral %</span>
                      </label>
                      <input
                        type="number"
                        name="referralDollar"
                        value={formData.referralDollar}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Adjusted GCI
                        <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from GCI minus Referral</span>
                      </label>
                      <input
                        type="number"
                        name="adjustedGci"
                        value={formData.adjustedGci}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Brokerage-Specific Fields */}
                {(formData.brokerage === 'KW' || formData.brokerage === 'Keller Williams') && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Keller Williams Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Errors & Omissions (E&O)</label>
                        <input
                          type="number"
                          name="eo"
                          value={formData.eo}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Royalty (6%)
                          <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from Adjusted GCI</span>
                        </label>
                        <input
                          type="number"
                          name="royalty"
                          value={formData.royalty}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Company Dollar (10%)
                          <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from Adjusted GCI</span>
                        </label>
                        <input
                          type="number"
                          name="companyDollar"
                          value={formData.companyDollar}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">HOA Transfer</label>
                        <input
                          type="number"
                          name="hoaTransfer"
                          value={formData.hoaTransfer}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Home Warranty</label>
                        <input
                          type="number"
                          name="homeWarranty"
                          value={formData.homeWarranty}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">KW Cares</label>
                        <input
                          type="number"
                          name="kwCares"
                          value={formData.kwCares}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">NEXT GEN</label>
                        <input
                          type="number"
                          name="kwNextGen"
                          value={formData.kwNextGen}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">BOLD Scholarship</label>
                        <input
                          type="number"
                          name="boldScholarship"
                          value={formData.boldScholarship}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">TC/Concierge</label>
                        <input
                          type="number"
                          name="tcConcierge"
                          value={formData.tcConcierge}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Jelmberg Team</label>
                        <input
                          type="number"
                          name="jelmbergTeam"
                          value={formData.jelmbergTeam}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(formData.brokerage === 'BDH' || formData.brokerage === 'Bennion Deville Homes') && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Bennion Deville Homes Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">BDH Split % (Default: 94%)</label>
                        <input
                          type="number"
                          name="bdhSplitPct"
                          value={formData.bdhSplitPct}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="94.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Pre-Split Deduction (6%)
                          <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from Adjusted GCI</span>
                        </label>
                        <input
                          type="number"
                          name="preSplitDeduction"
                          value={formData.preSplitDeduction}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Agent Services Fee (ASF)</label>
                        <input
                          type="number"
                          name="asf"
                          value={formData.asf}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Foundation10</label>
                        <input
                          type="number"
                          name="foundation10"
                          value={formData.foundation10}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Admin Fee</label>
                        <input
                          type="number"
                          name="adminFee"
                          value={formData.adminFee}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Universal Fields */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Additional Deductions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Other Deductions</label>
                      <input
                        type="number"
                        name="otherDeductions"
                        value={formData.otherDeductions}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Buyer's Agent Split</label>
                      <input
                        type="number"
                        name="buyersAgentSplit"
                        value={formData.buyersAgentSplit}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Assistant Bonus (FYI only)</label>
                      <input
                        type="number"
                        name="assistantBonus"
                        value={formData.assistantBonus}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Not included in NCI calculation</p>
                    </div>
                  </div>
                </div>

                {/* Calculated Summary */}
                <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Commission Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Total Brokerage Fees
                        <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from all deductions</span>
                      </label>
                      <input
                        type="number"
                        name="totalBrokerageFees"
                        value={formData.totalBrokerageFees}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Net Commission Income (NCI)
                        <span className="text-xs text-info-500 dark:text-info-400 ml-2">✏️ Editable - auto-calculates from Adjusted GCI minus fees</span>
                      </label>
                      <input
                        type="number"
                        name="nci"
                        value={formData.nci}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-success-300 dark:border-success-600 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white dark:bg-gray-700 text-success-700 dark:text-success-300 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, hsl(250, 60%, 50%) 0%, hsl(250, 55%, 60%) 100%)',
                      border: '2px solid hsl(250, 70%, 65%)',
                      boxShadow: '0 2px 8px hsla(0, 0%, 25%, 0.2)'
                    }}
                  >
                    {editingId ? 'Update Transaction' : 'Add Transaction'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-3xl max-w-4xl w-full my-8 transition-colors overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                    <Home className="w-5 h-5 text-primary-500" />
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
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase block mb-1">Client Type</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        viewingTransaction.clientType === 'Buyer' 
                          ? 'bg-info-600 text-white' 
                          : 'bg-warning-600 text-gray-900'
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
                    <Calendar className="w-5 h-5 text-primary-500" />
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
                        {viewingTransaction.brokerage === 'KW' || viewingTransaction.brokerage === 'Keller Williams' ? 'Keller Williams (KW)' : 'Bennion Deville Homes (BDH)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(viewingTransaction.source || viewingTransaction.referralPct > 0 || viewingTransaction.assistantBonus > 0 || viewingTransaction.buyersAgentSplit > 0) && (
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
                    className="px-6 py-3 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleEdit(viewingTransaction)}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Edit Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-morphism bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border-2 border-white/30 dark:border-gray-700/30 backdrop-blur-3xl animate-[fadeIn_0.3s_ease-out]">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Manage your dashboard preferences</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto space-y-6">
                
                {/* Personalization Section */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">👤</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personalization</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Agent Name
                      </label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => {
                          setAgentName(e.target.value);
                          localStorage.setItem('agentName', e.target.value);
                        }}
                        placeholder="Your name"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Company / Brokerage
                      </label>
                      <input
                        type="text"
                        value={agentCompany}
                        onChange={(e) => {
                          setAgentCompany(e.target.value);
                          localStorage.setItem('agentCompany', e.target.value);
                        }}
                        placeholder="Your company name"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This will appear in the header subtitle
                    </p>
                  </div>
                </div>
                
                {/* Appearance Section */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">🎨</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme Preference</label>
                      <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Choose your preferred color scheme</span>
                      </div>
                    </div>

                    {/* Logo Management */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dashboard Logo</label>
                      <div className="flex items-center gap-4">
                        {customLogo && (
                          <div className="relative group">
                            <img 
                              src={customLogo} 
                              alt="Logo Preview" 
                              className="w-20 h-20 rounded-xl shadow-lg object-cover border-2 border-white/30 dark:border-gray-700/30"
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
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 px-4 py-2.5 glass-morphism bg-purple-500/80 hover:bg-purple-600/80 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-xl">
                            <Upload className="w-4 h-4" />
                            <span className="font-medium text-sm">{customLogo ? 'Change Logo' : 'Upload Logo'}</span>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, or WebP • Max 5MB • Recommended: 512x512px</p>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">⌨️</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Speed up your workflow with these keyboard shortcuts. Works on both Mac and PC.
                    </p>
                    
                    {/* Shortcuts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Add Transaction */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Plus className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Add Transaction</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">⌘</kbd>
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">N</kbd>
                        </div>
                      </div>

                      {/* Sync */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-4 h-4 text-success-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Sync Sheets</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">⌘</kbd>
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">R</kbd>
                        </div>
                      </div>

                      {/* Settings */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4 text-info-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Open Settings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">⌘</kbd>
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">,</kbd>
                        </div>
                      </div>

                      {/* Close Modal */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <X className="w-4 h-4 text-danger-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Close Modal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">Esc</kbd>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 text-info-500 text-center font-bold">/</div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Search Transactions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">/</kbd>
                        </div>
                      </div>
                    </div>

                    {/* Platform Note */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> On Windows/Linux, use <kbd className="px-1 py-0.5 text-xs font-mono bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">Ctrl</kbd> instead of <kbd className="px-1 py-0.5 text-xs font-mono bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">⌘</kbd>. All shortcuts follow Apple HIG guidelines and avoid system conflicts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Sheets Integration */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">☁️</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Google Sheets Sync</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {isGoogleSheetsEnabled && isGoogleSheetsAuthorized ? (
                          <>
                            <Cloud className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">Connected</p>
                              {lastSyncTime && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Last synced: {lastSyncTime.toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <CloudOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">Offline Mode</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Not connected to Google Sheets</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {!isGoogleSheetsAuthorized ? (
                        <button
                          onClick={enableGoogleSheets}
                          disabled={isSyncing}
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-lg font-medium"
                        >
                          <Cloud className="w-4 h-4" />
                          {isSyncing ? 'Connecting...' : 'Connect Google Sheets'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={syncNow}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 shadow-lg font-medium"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                          </button>
                          <button
                            onClick={signOutGoogleSheets}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-lg font-medium"
                          >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                          </button>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    {isGoogleSheetsAuthorized && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Two-way sync enabled!</strong> Changes made in the dashboard or Google Sheets will automatically sync.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Management */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">💾</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Management</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={exportToCSV}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Export to CSV</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Download all transactions as CSV file</p>
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">→</div>
                    </button>

                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>Filtered Export:</strong> Only currently filtered transactions will be exported.
                      </p>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="glass-morphism bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-white/30 dark:border-gray-600/30 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">ℹ️</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">About</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Version:</strong> v3.13.0</p>
                    <p><strong>Features:</strong> AI Scanner • Referral Tracking • Two-way Sync</p>
                    <p><strong>Total Transactions:</strong> {transactions.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      Professional real estate commission tracking
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRealEstateDashboard;
