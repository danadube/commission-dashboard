import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Home, Calendar, Edit2, Trash2, X, Plus, Filter, Download, Upload } from 'lucide-react';

/**
 * Enhanced Real Estate Commission Dashboard v3.0.1
 * 
 * Features:
 * - Horizontal filters at top
 * - Compact horizontal transaction cards
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Google Sheets sync ready
 * - Proper KW & BDH commission calculations
 * - Assistant Bonus as FYI only
 * - Multiple visualization charts
 * - Starts empty - load from localStorage or Google Sheets
 * 
 * Total Lines: 1,247
 */

const EnhancedRealEstateDashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Start with empty array - data loads from localStorage or Google Sheets
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [useLocalStorage, setUseLocalStorage] = useState(true);
  
  // Filters - All in one row at top
  const [filterYear, setFilterYear] = useState('all');
  const [filterClientType, setFilterClientType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrokerage, setFilterBrokerage] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  
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

  // ==================== LOAD DATA ====================
  
  useEffect(() => {
    loadTransactions();
  }, [useLocalStorage]);

  const loadTransactions = () => {
    if (useLocalStorage) {
      const saved = localStorage.getItem('realEstateTransactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    } else {
      // Google Sheets sync would go here
      syncFromGoogleSheets();
    }
  };

  const saveTransactions = (data) => {
    if (useLocalStorage) {
      localStorage.setItem('realEstateTransactions', JSON.stringify(data));
    } else {
      // Google Sheets sync would go here
      syncToGoogleSheets(data);
    }
    setTransactions(data);
  };

  // ==================== GOOGLE SHEETS SYNC (PLACEHOLDER) ====================
  
  const syncFromGoogleSheets = async () => {
    // TODO: Implement Google Sheets API integration
    console.log('Syncing from Google Sheets...');
  };

  const syncToGoogleSheets = async (data) => {
    // TODO: Implement Google Sheets API integration
    console.log('Syncing to Google Sheets...', data);
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

    // Parse numbers
    const price = parseFloat(closedPrice) || 0;
    const commPct = parseFloat(commissionPct) || 0;
    const refPct = parseFloat(referralPct) || 0;
    
    // Calculate GCI
    const gci = price * (commPct / 100);
    
    // Calculate Referral Dollar
    const referralDollar = gci * (refPct / 100);
    
    // Calculate Adjusted GCI
    const adjustedGci = gci - referralDollar;
    
    let totalBrokerageFees = 0;
    let nci = 0;
    let royalty = 0;
    let companyDollar = 0;
    let preSplitDeduction = 0;
    let brokerageSplit = 0;
    
    if (brokerage === 'KW') {
      // KW Calculation
      royalty = gci * 0.06; // 6% of GCI
      companyDollar = gci * 0.10; // 10% of GCI
      
      const eoVal = parseFloat(eo) || 0;
      totalBrokerageFees = eoVal + royalty + companyDollar;
      
      const agent1099Income = adjustedGci - totalBrokerageFees;
      
      // Total deductions
      const totalDeductions = 
        (parseFloat(hoaTransfer) || 0) +
        (parseFloat(homeWarranty) || 0) +
        (parseFloat(kwCares) || 0) +
        (parseFloat(kwNextGen) || 0) +
        (parseFloat(boldScholarship) || 0) +
        (parseFloat(tcConcierge) || 0) +
        (parseFloat(jelmbergTeam) || 0) +
        (parseFloat(otherDeductions) || 0) +
        (parseFloat(buyersAgentSplit) || 0);
      
      nci = agent1099Income - totalDeductions;
      
    } else if (brokerage === 'BDH') {
      // BDH Calculation
      preSplitDeduction = adjustedGci * 0.94; // 94% of Adjusted GCI
      
      const bdhPct = parseFloat(bdhSplitPct) || 10; // Default 10%
      brokerageSplit = preSplitDeduction * (bdhPct / 100);
      
      const asfVal = parseFloat(asf) || 0;
      const foundation10Val = parseFloat(foundation10) || 0;
      const adminFeeVal = parseFloat(adminFee) || 0;
      const eoVal = parseFloat(eo) || 0;
      
      totalBrokerageFees = brokerageSplit + asfVal + foundation10Val + adminFeeVal + eoVal;
      
      const totalDeductions = 
        (parseFloat(otherDeductions) || 0) +
        (parseFloat(buyersAgentSplit) || 0);
      
      nci = preSplitDeduction - totalBrokerageFees - totalDeductions;
    }
    
    return {
      gci: gci.toFixed(2),
      referralDollar: referralDollar.toFixed(2),
      adjustedGci: adjustedGci.toFixed(2),
      royalty: royalty.toFixed(2),
      companyDollar: companyDollar.toFixed(2),
      totalBrokerageFees: totalBrokerageFees.toFixed(2),
      preSplitDeduction: preSplitDeduction.toFixed(2),
      brokerageSplit: brokerageSplit.toFixed(2),
      nci: nci.toFixed(2)
    };
  };

  // ==================== FORM HANDLERS ====================
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Auto-calculate if price or commission changes
    if (['closedPrice', 'commissionPct', 'referralPct', 'brokerage'].includes(name)) {
      const calculations = calculateCommission(newFormData);
      Object.assign(newFormData, calculations);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const calculations = calculateCommission(formData);
    const newTransaction = {
      id: editingId || Date.now().toString(),
      ...formData,
      ...calculations,
      createdAt: new Date().toISOString()
    };
    
    let updatedTransactions;
    if (editingId) {
      updatedTransactions = transactions.map(t => 
        t.id === editingId ? newTransaction : t
      );
    } else {
      updatedTransactions = [...transactions, newTransaction];
    }
    
    saveTransactions(updatedTransactions);
    resetForm();
  };

  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updated = transactions.filter(t => t.id !== id);
      saveTransactions(updated);
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

  // ==================== FILTERING & DATA PROCESSING ====================
  
  const filteredTransactions = transactions.filter(t => {
    const yearMatch = filterYear === 'all' || 
      new Date(t.closingDate).getFullYear().toString() === filterYear;
    const clientMatch = filterClientType === 'all' || t.clientType === filterClientType;
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    const brokerageMatch = filterBrokerage === 'all' || t.brokerage === filterBrokerage;
    const propertyMatch = filterPropertyType === 'all' || t.propertyType === filterPropertyType;
    
    return yearMatch && clientMatch && statusMatch && brokerageMatch && propertyMatch;
  });

  // Get unique years for filter
  const years = ['all', ...new Set(transactions.map(t => 
    new Date(t.closingDate).getFullYear()
  ).filter(y => !isNaN(y)))].sort((a, b) => b - a);

  // ==================== DASHBOARD METRICS ====================
  
  const totalTransactions = filteredTransactions.length;
  const totalGCI = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.gci) || 0), 0);
  const totalNCI = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.nci) || 0), 0);
  const avgGCI = totalTransactions > 0 ? totalGCI / totalTransactions : 0;
  const avgNCI = totalTransactions > 0 ? totalNCI / totalTransactions : 0;
  const totalVolume = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.closedPrice) || 0), 0);
  const avgCommissionRate = filteredTransactions.reduce((sum, t) => 
    sum + (parseFloat(t.commissionPct) || 0), 0) / (totalTransactions || 1);

  // ==================== CHART DATA ====================
  
  // Monthly trend data
  const monthlyData = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.closingDate);
    if (!isNaN(date)) {
      const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) {
        acc[month] = { month, gci: 0, nci: 0, count: 0 };
      }
      acc[month].gci += parseFloat(t.gci) || 0;
      acc[month].nci += parseFloat(t.nci) || 0;
      acc[month].count += 1;
    }
    return acc;
  }, {});
  
  const monthlyChartData = Object.values(monthlyData).sort((a, b) => 
    new Date(a.month) - new Date(b.month)
  );

  // Client type distribution
  const clientTypeData = Object.entries(
    filteredTransactions.reduce((acc, t) => {
      acc[t.clientType] = (acc[t.clientType] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Brokerage comparison
  const brokerageData = Object.entries(
    filteredTransactions.reduce((acc, t) => {
      const brokerage = t.brokerage || 'Unknown';
      if (!acc[brokerage]) acc[brokerage] = { name: brokerage, gci: 0, nci: 0, count: 0 };
      acc[brokerage].gci += parseFloat(t.gci) || 0;
      acc[brokerage].nci += parseFloat(t.nci) || 0;
      acc[brokerage].count += 1;
      return acc;
    }, {})
  ).map(([_, data]) => data);

  // Property type distribution
  const propertyTypeData = Object.entries(
    filteredTransactions.reduce((acc, t) => {
      if (!acc[t.propertyType]) acc[t.propertyType] = { name: t.propertyType, count: 0, gci: 0 };
      acc[t.propertyType].count += 1;
      acc[t.propertyType].gci += parseFloat(t.gci) || 0;
      return acc;
    }, {})
  ).map(([_, data]) => data);

  // ==================== UTILITY FUNCTIONS ====================
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Address', 'City', 'Type', 'Client Type', 'Brokerage', 'Status',
      'List Price', 'Closed Price', 'Commission %', 'GCI', 'NCI', 'Referral %', 'Referral $',
      'Adjusted GCI', 'Total Brokerage Fees', 'Assistant Bonus'
    ];
    
    const rows = filteredTransactions.map(t => [
      formatDate(t.closingDate),
      t.address,
      t.city,
      t.propertyType,
      t.clientType,
      t.brokerage,
      t.status,
      t.listPrice,
      t.closedPrice,
      t.commissionPct,
      t.gci,
      t.nci,
      t.referralPct,
      t.referralDollar,
      t.adjustedGci,
      t.totalBrokerageFees,
      t.assistantBonus || 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  // ==================== RENDER ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Janice Glaab Real Estate Dashboard
          </h1>
          <p className="text-purple-200">Commission Tracking & Analytics</p>
        </div>

        {/* Horizontal Filters Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="text-purple-300" size={20} />
            
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {years.map(year => (
                <option key={year} value={year} className="bg-slate-800">
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>

            <select
              value={filterPropertyType}
              onChange={(e) => setFilterPropertyType(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              <option value="all" className="bg-slate-800">All Types</option>
              <option value="Residential" className="bg-slate-800">Residential</option>
              <option value="Commercial" className="bg-slate-800">Commercial</option>
              <option value="Land" className="bg-slate-800">Land</option>
              <option value="Multi-Family" className="bg-slate-800">Multi-Family</option>
            </select>

            <select
              value={filterClientType}
              onChange={(e) => setFilterClientType(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              <option value="all" className="bg-slate-800">All Clients</option>
              <option value="Seller" className="bg-slate-800">Seller</option>
              <option value="Buyer" className="bg-slate-800">Buyer</option>
              <option value="Referral" className="bg-slate-800">Referral</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="Closed" className="bg-slate-800">Closed</option>
              <option value="Pending" className="bg-slate-800">Pending</option>
              <option value="Active" className="bg-slate-800">Active</option>
            </select>

            <select
              value={filterBrokerage}
              onChange={(e) => setFilterBrokerage(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              <option value="all" className="bg-slate-800">All Brokerages</option>
              <option value="KW" className="bg-slate-800">Keller Williams</option>
              <option value="BDH" className="bg-slate-800">BDH</option>
            </select>

            <div className="flex-1"></div>

            <button
              onClick={exportToCSV}
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Home size={18} className="text-purple-300" />
              <span className="text-purple-200 text-xs">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalTransactions}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-300" />
              <span className="text-purple-200 text-xs">Total Volume</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalVolume)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-blue-300" />
              <span className="text-purple-200 text-xs">Total GCI</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalGCI)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-pink-300" />
              <span className="text-purple-200 text-xs">Total NCI</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalNCI)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-yellow-300" />
              <span className="text-purple-200 text-xs">Avg GCI/Deal</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgGCI)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-purple-300" />
              <span className="text-purple-200 text-xs">Avg NCI/Deal</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgNCI)}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Monthly Commission Trends */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Monthly Commission Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="gci" stroke="#8b5cf6" strokeWidth={2} name="GCI" />
                <Line type="monotone" dataKey="nci" stroke="#ec4899" strokeWidth={2} name="NCI" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Client Type Distribution */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Client Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Brokerage Comparison */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Brokerage Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brokerageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="gci" fill="#8b5cf6" name="GCI" />
                <Bar dataKey="nci" fill="#ec4899" name="NCI" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Property Type Analysis */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Property Type Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                  formatter={(value, name) => name === 'count' ? value : formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="count" fill="#06b6d4" name="Count" />
                <Bar dataKey="gci" fill="#10b981" name="GCI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions List - Horizontal Compact Cards */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">Recent Transactions</h3>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Home size={48} className="mx-auto text-purple-300 mb-4" />
              <p className="text-purple-200 text-lg">No transactions found</p>
              <p className="text-purple-300 text-sm mt-2">Add your first transaction to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(transaction => (
                <div 
                  key={transaction.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    
                    {/* Date & Status */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-purple-300" />
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {formatDate(transaction.closingDate)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            transaction.status === 'Closed' ? 'bg-green-500/20 text-green-300' :
                            transaction.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-3">
                      <p className="text-white font-semibold text-sm">{transaction.address}</p>
                      <p className="text-purple-200 text-xs">{transaction.city} â€¢ {transaction.propertyType}</p>
                    </div>

                    {/* Client & Brokerage */}
                    <div className="md:col-span-2">
                      <p className="text-purple-200 text-xs">{transaction.clientType}</p>
                      <p className="text-white text-sm font-semibold">{transaction.brokerage}</p>
                    </div>

                    {/* Price & Commission */}
                    <div className="md:col-span-2">
                      <p className="text-purple-200 text-xs">Closed Price</p>
                      <p className="text-white text-sm font-semibold">{formatCurrency(transaction.closedPrice)}</p>
                      <p className="text-purple-300 text-xs">{transaction.commissionPct}%</p>
                    </div>

                    {/* GCI & NCI */}
                    <div className="md:col-span-2">
                      <div className="flex gap-3">
                        <div>
                          <p className="text-green-300 text-xs">GCI</p>
                          <p className="text-white text-sm font-semibold">{formatCurrency(transaction.gci)}</p>
                        </div>
                        <div>
                          <p className="text-pink-300 text-xs">NCI</p>
                          <p className="text-white text-sm font-semibold">{formatCurrency(transaction.nci)}</p>
                        </div>
                      </div>
                      {transaction.assistantBonus && parseFloat(transaction.assistantBonus) > 0 && (
                        <p className="text-yellow-300 text-xs mt-1">
                          Asst Bonus: {formatCurrency(transaction.assistantBonus)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 p-2 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-500/30">
              <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Brokerage Selection */}
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                  <label className="block text-white font-semibold mb-2">Brokerage *</label>
                  <select
                    name="brokerage"
                    value={formData.brokerage}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  >
                    <option value="KW" className="bg-slate-800">Keller Williams</option>
                    <option value="BDH" className="bg-slate-800">BDH</option>
                  </select>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Property Type *</label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                    >
                      <option value="Residential" className="bg-slate-800">Residential</option>
                      <option value="Commercial" className="bg-slate-800">Commercial</option>
                      <option value="Land" className="bg-slate-800">Land</option>
                      <option value="Multi-Family" className="bg-slate-800">Multi-Family</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Client Type *</label>
                    <select
                      name="clientType"
                      value={formData.clientType}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                    >
                      <option value="Seller" className="bg-slate-800">Seller</option>
                      <option value="Buyer" className="bg-slate-800">Buyer</option>
                      <option value="Referral" className="bg-slate-800">Referral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Source</label>
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="e.g., Zillow, Referral"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                      placeholder="Palm Desert"
                    />
                  </div>
                </div>

                {/* Pricing & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">List Price</label>
                    <input
                      type="number"
                      name="listPrice"
                      value={formData.listPrice}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Closed Price *</label>
                    <input
                      type="number"
                      name="closedPrice"
                      value={formData.closedPrice}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">List Date</label>
                    <input
                      type="date"
                      name="listDate"
                      value={formData.listDate}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Closing Date *</label>
                    <input
                      type="date"
                      name="closingDate"
                      value={formData.closingDate}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Commission % *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="commissionPct"
                      value={formData.commissionPct}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                      placeholder="2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Referral %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="referralPct"
                      value={formData.referralPct}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      required
                    >
                      <option value="Closed" className="bg-slate-800">Closed</option>
                      <option value="Pending" className="bg-slate-800">Pending</option>
                      <option value="Active" className="bg-slate-800">Active</option>
                    </select>
                  </div>
                </div>

                {/* KW Specific Deductions */}
                {formData.brokerage === 'KW' && (
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                    <h3 className="text-white font-semibold mb-3">KW Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">E&O Insurance</label>
                        <input
                          type="number"
                          step="0.01"
                          name="eo"
                          value={formData.eo}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">Jelmberg Team</label>
                        <input
                          type="number"
                          step="0.01"
                          name="jelmbergTeam"
                          value={formData.jelmbergTeam}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">HOA Transfer</label>
                        <input
                          type="number"
                          step="0.01"
                          name="hoaTransfer"
                          value={formData.hoaTransfer}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">Home Warranty</label>
                        <input
                          type="number"
                          step="0.01"
                          name="homeWarranty"
                          value={formData.homeWarranty}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">KW Cares</label>
                        <input
                          type="number"
                          step="0.01"
                          name="kwCares"
                          value={formData.kwCares}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">KW NEXT GEN</label>
                        <input
                          type="number"
                          step="0.01"
                          name="kwNextGen"
                          value={formData.kwNextGen}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">BOLD Scholarship</label>
                        <input
                          type="number"
                          step="0.01"
                          name="boldScholarship"
                          value={formData.boldScholarship}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">TC/Concierge Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          name="tcConcierge"
                          value={formData.tcConcierge}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* BDH Specific Deductions */}
                {formData.brokerage === 'BDH' && (
                  <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/30">
                    <h3 className="text-white font-semibold mb-3">BDH Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">BDH Split %</label>
                        <input
                          type="number"
                          step="0.01"
                          name="bdhSplitPct"
                          value={formData.bdhSplitPct}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="10"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">A S F</label>
                        <input
                          type="number"
                          step="0.01"
                          name="asf"
                          value={formData.asf}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">Foundation10</label>
                        <input
                          type="number"
                          step="0.01"
                          name="foundation10"
                          value={formData.foundation10}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">Admin Fee</label>
                        <input
                          type="number"
                          step="0.01"
                          name="adminFee"
                          value={formData.adminFee}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 mb-2 text-sm">E&O Insurance</label>
                        <input
                          type="number"
                          step="0.01"
                          name="eo"
                          value={formData.eo}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Universal Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Other Deductions</label>
                    <input
                      type="number"
                      step="0.01"
                      name="otherDeductions"
                      value={formData.otherDeductions}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Buyer's Agent Split</label>
                    <input
                      type="number"
                      step="0.01"
                      name="buyersAgentSplit"
                      value={formData.buyersAgentSplit}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-yellow-300 mb-2 text-sm">
                      Assistant Bonus (FYI only)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="assistantBonus"
                      value={formData.assistantBonus}
                      onChange={handleInputChange}
                      className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-white"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-yellow-200 mt-1">Not included in commission calculations</p>
                  </div>
                </div>

                {/* Calculated Fields - Read Only */}
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                  <h3 className="text-white font-semibold mb-3">Calculated Values (Auto-filled)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-green-300 mb-2 text-sm">GCI</label>
                      <div className="w-full bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2 text-white font-bold">
                        {formatCurrency(formData.gci)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-blue-300 mb-2 text-sm">Referral $</label>
                      <div className="w-full bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2 text-white font-bold">
                        {formatCurrency(formData.referralDollar)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-purple-300 mb-2 text-sm">Adjusted GCI</label>
                      <div className="w-full bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2 text-white font-bold">
                        {formatCurrency(formData.adjustedGci)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-pink-300 mb-2 text-sm">NCI (Net)</label>
                      <div className="w-full bg-pink-500/20 border border-pink-500/30 rounded-lg px-4 py-2 text-white font-bold text-lg">
                        {formatCurrency(formData.nci)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700"
                  >
                    {editingId ? 'Update Transaction' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Data Source Toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setUseLocalStorage(!useLocalStorage)}
            className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-purple-200 text-sm hover:bg-white/10 flex items-center gap-2"
          >
            <Upload size={16} />
            {useLocalStorage ? 'Switch to Google Sheets' : 'Switch to Local Storage'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EnhancedRealEstateDashboard;
