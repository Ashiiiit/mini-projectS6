import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Search, Bell, MessageCircle, HelpCircle, Mail, PieChart as PieChartIcon, 
  CreditCard, Settings, User, Trash2, Edit2, Check, Download, AlertTriangle, 
  LogOut, Save, Lock, Plus, Tag, X, Sun, Moon, Sparkles, Flame, BrainCircuit, 
  Wand2, TrendingUp, Activity, ScanLine, Target, Repeat, FileText, Users 
} from 'lucide-react';

const API_URL = "http://localhost:8000/api/expenses";
const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#9E69AF', '#FF6D00', '#e83e8c'];

const TABS = [
  { id: 'Dashboard', icon: HelpCircle },
  { id: 'Transactions', icon: Mail },
  { id: 'Analytics', icon: PieChartIcon },
  { id: 'Budgets', icon: CreditCard },
  { id: 'Goals', icon: Target },
  { id: 'Groups', icon: Users }, // <-- NEW GROUPS/SPLITTER TAB
  { id: 'Subscriptions', icon: Repeat },
  { id: 'AI Advisor', icon: Sparkles },
  { id: 'Settings', icon: Settings },
];
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Housing'];

// --- WHATSAPP SPLIT BUTTON COMPONENT ---
const WhatsAppSplitButton = ({ friendName, amountOwed, upiId }) => {
  const handleSendRequest = () => {
    const upiLink = `upi://pay?pa=${upiId}&pn=ExpenseTracker&am=${amountOwed}&cu=INR`;
    const message = `Hey ${friendName}! 👋 \n\nTo settle our shared bills, your total share comes out to ₹${amountOwed}. \n\nYou can pay me directly using this UPI link (works on GPay/PhonePe): \n${upiLink} \n\nThanks!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <button 
      onClick={handleSendRequest}
      className="flex items-center justify-center py-2 px-4 mt-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-colors text-sm w-full"
    >
      <MessageCircle size={16} className="mr-2" />
      Request ₹{amountOwed} via WhatsApp
    </button>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('isDarkMode') === 'true');

  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ date: '', name: '', title: '', expense: '' });
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem('myBalance')) || 8750);
  const [income, setIncome] = useState(() => parseFloat(localStorage.getItem('myIncome')) || 5200);
  const [currency, setCurrency] = useState(() => localStorage.getItem('myCurrency') || '₹');
  const [userName, setUserName] = useState(() => localStorage.getItem('myUserName') || 'Alex Johnson');

  // --- MULTI-GOAL STATE ---
  const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('myGoals')) || [
    { id: 1, name: 'New Laptop', target: 50000, saved: 15000 },
    { id: 2, name: 'Emergency Fund', target: 100000, saved: 5000 }
  ]);
  const [goalForm, setGoalForm] = useState({ name: '', target: '' });

  useEffect(() => { localStorage.setItem('myGoals', JSON.stringify(goals)); }, [goals]);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target) return;
    setGoals([...goals, { id: Date.now(), name: goalForm.name, target: parseFloat(goalForm.target), saved: 0 }]);
    setGoalForm({ name: '', target: '' });
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm("Remove this savings goal?")) setGoals(goals.filter(g => g.id !== id));
  };

  const handleAddFundsPrompt = (id, currentName) => {
    const amount = parseFloat(window.prompt(`How much are you adding to your "${currentName}" fund?`));
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount!");
    setGoals(goals.map(g => g.id === id ? { ...g, saved: g.saved + amount } : g));
  };

  
  // --- BILL SPLITTER STATE ---
  const [debts, setDebts] = useState([
    { id: 1, debtor: 'Rahul', creditor: 'You', amount: 500 },
    { id: 2, debtor: 'Priya', creditor: 'Rahul', amount: 200 },
    { id: 3, debtor: 'You', creditor: 'Priya', amount: 300 }
  ]);
  const [debtForm, setDebtForm] = useState({ debtor: '', creditor: '', amount: '' });
  const [settlements, setSettlements] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // New states for editing
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [editDebtForm, setEditDebtForm] = useState({ debtor: '', creditor: '', amount: '' });

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!debtForm.debtor || !debtForm.creditor || !debtForm.amount) return;
    setDebts([...debts, { id: Date.now(), debtor: debtForm.debtor, creditor: debtForm.creditor, amount: parseFloat(debtForm.amount) }]);
    setDebtForm({ debtor: '', creditor: '', amount: '' });
    setSettlements([]); // Clear old optimizations when adding
  };

  const handleDeleteDebt = (id) => {
    setDebts(debts.filter(d => d.id !== id));
    setSettlements([]); // Clear old optimizations when deleting
  };

  // New Edit Functions
  const startEditingDebt = (debt) => {
    setEditingDebtId(debt.id);
    setEditDebtForm({ debtor: debt.debtor, creditor: debt.creditor, amount: debt.amount });
  };

  const handleSaveEditedDebt = () => {
    if (!editDebtForm.debtor || !editDebtForm.creditor || !editDebtForm.amount) return;
    setDebts(debts.map(d => d.id === editingDebtId ? { ...d, debtor: editDebtForm.debtor, creditor: editDebtForm.creditor, amount: parseFloat(editDebtForm.amount) } : d));
    setEditingDebtId(null);
    setSettlements([]); // Clear old optimizations when editing
  };

  const handleCancelEditDebt = () => { setEditingDebtId(null); };

  const handleOptimizeDebts = async () => {
    if (debts.length === 0) return alert("No debts to optimize!");
    setIsOptimizing(true);
    try {
      const response = await fetch("http://localhost:8000/api/settle-debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debts: debts }),
      });
      const data = await response.json();
      setSettlements(data.optimized_settlements);
    } catch (error) {
      console.error("Failed to calculate settlements:", error);
      alert("Error: Ensure your Python backend is running!");
    }
    setIsOptimizing(false);
  };

  // --- SUBSCRIPTIONS STATE ---
  const [subscriptions, setSubscriptions] = useState(() => JSON.parse(localStorage.getItem('mySubs')) || [
    { id: 1, name: 'Netflix', amount: 649 },
    { id: 2, name: 'Gym Membership', amount: 1500 }
  ]);
  const [subForm, setSubForm] = useState({ name: '', amount: '' });

  useEffect(() => { localStorage.setItem('mySubs', JSON.stringify(subscriptions)); }, [subscriptions]);

  const handleAddSubscription = (e) => {
    e.preventDefault();
    if (!subForm.name || !subForm.amount) return;
    setSubscriptions([...subscriptions, { id: Date.now(), name: subForm.name, amount: parseFloat(subForm.amount) }]);
    setSubForm({ name: '', amount: '' });
  };

  const handleDeleteSubscription = (id) => {
    if (window.confirm("Delete this subscription?")) setSubscriptions(subscriptions.filter(s => s.id !== id));
  };

  const totalMonthlySubs = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const yearlyBurnRate = totalMonthlySubs * 12;

  // --- PDF REPORT GENERATOR ---
  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank');
    const d = new Date().toLocaleDateString();
    
    const htmlContent = `
      <html>
        <head>
          <title>Expense Report - ${d}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
            .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Financial Summary Report</h1>
          <p><strong>Date Generated:</strong> ${d}</p>
          
          <div class="summary">
            <h2>Account Overview</h2>
            <p><strong>Starting Balance:</strong> ${currency}${balance}</p>
            <p><strong>Total Expenses:</strong> ${currency}${totalExpenses}</p>
            <p><strong>Current Balance:</strong> ${currency}${balance - totalExpenses}</p>
            <p><strong>Yearly Subscription Cost:</strong> ${currency}${yearlyBurnRate}</p>
          </div>

          <h2>Recent Transactions</h2>
          <table>
            <tr><th>Date</th><th>Name</th><th>Category</th><th>Amount</th></tr>
            ${expenses.map(exp => `<tr><td>${exp.date}</td><td>${exp.name}</td><td>${exp.title}</td><td>${currency}${exp.expense}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250); 
  };

  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('myBudgets')) || [
    { id: 1, category: 'Food', limit: 1500 },
    { id: 2, category: 'Entertainment', limit: 500 }
  ]);
  const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' });

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudgetForm, setEditBudgetForm] = useState({ category: '', limit: '' });
  const [customCategories, setCustomCategories] = useState(() => JSON.parse(localStorage.getItem('myCustomCategories')) || []);

  const [tempCurrency, setTempCurrency] = useState(currency);
  const [tempUserName, setTempUserName] = useState(userName);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);

  const [isAILoading, setIsAILoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [aiRoast, setAiRoast] = useState("");
  const [predictedTotal, setPredictedTotal] = useState(0);
  const [predictedCategories, setPredictedCategories] = useState([]);

  const fetchExpenses = async (searchTerm = "") => {
    try {
      const response = await fetch(`${API_URL}?search=${searchTerm}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { if (isLoggedIn) fetchExpenses(); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('myBudgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('myCustomCategories', JSON.stringify(customCategories)); }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', isDarkMode);
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogin = (e) => { 
    e.preventDefault(); 
    localStorage.setItem('isLoggedIn', 'true'); 
    setIsLoggedIn(true); 
  };
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.setItem('isLoggedIn', 'false'); 
      setIsLoggedIn(false); 
      setActiveTab("Dashboard"); 
      setIsProfileOpen(false); 
    }
  };

  const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newCat = formData.title.trim();
    if (newCat && !DEFAULT_CATEGORIES.includes(newCat) && !customCategories.includes(newCat)) setCustomCategories([...customCategories, newCat]);
    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, expense: parseFloat(formData.expense) }) });
    setFormData({ date: '', name: '', title: '', expense: '' });
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const handleScanClick = () => { fileInputRef.current.click(); };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setActiveTab("Dashboard"); 
        const today = new Date().toISOString().split('T')[0];
        setFormData({ date: today, name: "Scanned Receipt (Walmart)", title: "Food", expense: "142.50" });
        alert("Receipt Scanned Successfully! \n\nI've auto-filled the expense form below. Please verify and click 'Save Expense'.");
      }, 2500);
    }
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (!budgetForm.category || !budgetForm.limit) return;
    if (budgets.some(b => b.category.toLowerCase() === budgetForm.category.toLowerCase())) return alert("A budget for this category already exists!");
    setBudgets([...budgets, { id: Date.now(), category: budgetForm.category, limit: parseFloat(budgetForm.limit) }]);
    setBudgetForm({ category: '', limit: '' });
  };

  const handleDeleteBudget = (id) => { if (window.confirm("Remove this budget?")) setBudgets(budgets.filter(b => b.id !== id)); };

  const startEditingBudget = (budget) => { setEditingBudgetId(budget.id); setEditBudgetForm({ category: budget.category, limit: budget.limit }); };
  const handleSaveEditedBudget = () => {
    if (!editBudgetForm.category || !editBudgetForm.limit) return;
    if (budgets.some(b => b.category.toLowerCase() === editBudgetForm.category.toLowerCase() && b.id !== editingBudgetId)) return alert("A budget for this category already exists!");
    setBudgets(budgets.map(b => b.id === editingBudgetId ? { ...b, category: editBudgetForm.category, limit: parseFloat(editBudgetForm.limit) } : b));
    setEditingBudgetId(null);
  };

  const handleCancelEditBudget = () => { setEditingBudgetId(null); };

  const handleDeleteCustomCategory = (categoryToRemove) => {
    if(window.confirm(`Delete "${categoryToRemove}" from your suggestions?`)) setCustomCategories(customCategories.filter(c => c !== categoryToRemove));
  };

  const saveBalance = () => { localStorage.setItem('myBalance', balance); setIsEditingBalance(false); };
  const saveIncome = () => { localStorage.setItem('myIncome', income); setIsEditingIncome(false); };

  const handleSaveSettings = () => {
    setCurrency(tempCurrency); setUserName(tempUserName); localStorage.setItem('myCurrency', tempCurrency); localStorage.setItem('myUserName', tempUserName); alert("Settings saved successfully!");
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return alert("No data to export!");
    const csvContent = "data:text/csv;charset=utf-8," + "Date,Name,Category,Amount\n" + expenses.map(e => `${e.date},${e.name},${e.title},${e.expense}`).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "Expense_Report.csv"); document.body.appendChild(link); link.click();
  };

  const clearAllData = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL your transactions. Are you absolutely sure?")) return;
    for (const exp of expenses) { await fetch(`${API_URL}/${exp.id}`, { method: 'DELETE' }); }
    fetchExpenses(); alert("All data wiped successfully.");
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.expense, 0);
  const currentBalance = balance - totalExpenses;

  const categoryData = Object.entries(expenses.reduce((acc, exp) => { acc[exp.title] = (acc[exp.title] || 0) + exp.expense; return acc; }, {})).map(([name, value]) => ({ name, value }));
  const monthlyData = Object.entries(expenses.reduce((acc, exp) => { const month = exp.date.substring(0, 7); acc[month] = (acc[month] || 0) + exp.expense; return acc; }, {})).sort().map(([month, amount]) => ({ name: month, Expenses: amount }));
  const suggestedCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const budgetProgressData = budgets.map(budget => {
    const spent = expenses.filter(exp => exp.title.toLowerCase() === budget.category.toLowerCase()).reduce((sum, exp) => sum + exp.expense, 0);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    let colorClass = "bg-green-500";
    if (percentage > 85) colorClass = "bg-red-500"; else if (percentage > 65) colorClass = "bg-yellow-500";
    return { ...budget, spent, percentage, colorClass };
  });

  const notifications = (() => {
    let alerts = [];
    if (currentBalance < 0) alerts.push({ type: 'critical', text: "CRITICAL: Your total balance is negative!" });
    budgetProgressData.forEach(b => {
      if (b.percentage > 100) alerts.push({ type: 'danger', text: `🚨 You have exceeded your ${b.category} budget!` });
      else if (b.percentage > 80) alerts.push({ type: 'warning', text: `⚠️ You are at ${Math.round(b.percentage)}% of your ${b.category} budget.` });
    });
    return alerts;
  })();

  const calculateHealthScore = () => {
    if (income <= 0) return 0;
    const savings = income - totalExpenses;
    const savingsRate = (savings / income) * 100;
    const savingsScore = Math.max(0, Math.min(40, (savingsRate / 30) * 40));
    const overBudgetCount = budgetProgressData.filter(b => b.percentage > 100).length;
    const budgetScore = Math.max(0, 40 - (overBudgetCount * 10));
    const activityScore = Math.min(20, expenses.length * 2);
    return Math.round(savingsScore + budgetScore + activityScore);
  };

  const healthScore = calculateHealthScore();

  const getGrade = (score) => {
    if (score >= 90) return { label: 'A+', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (score >= 75) return { label: 'B', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (score >= 50) return { label: 'C', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { label: 'D', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const grade = getGrade(healthScore);

  const runAIAnalysis = () => {
    setIsAILoading(true); setAiInsights(""); setAiRoast(""); setPredictedTotal(0); setPredictedCategories([]);
    setTimeout(() => {
      const savings = income - totalExpenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;
      const categoryTotals = expenses.reduce((acc, exp) => { acc[exp.title] = (acc[exp.title] || 0) + exp.expense; return acc; }, {});
      let topCategory = ""; let topSpend = 0;
      for (const [cat, amount] of Object.entries(categoryTotals)) { if (amount > topSpend) { topSpend = amount; topCategory = cat; } }

      let insightText = `Based on your data, you've spent ${currency}${totalExpenses.toFixed(2)} this cycle. `;
      if (savingsRate > 20) insightText += `Excellent work! You are saving ${savingsRate.toFixed(0)}% of your income.`;
      else if (savingsRate > 0) insightText += `You are saving ${savingsRate.toFixed(0)}% of your income. Try reducing "${topCategory || 'variable items'}".`;
      else insightText += `Warning: Your expenses currently exceed your income.`;
      setAiInsights(insightText);

      let roastText = "";
      if (topCategory && topSpend > (income * 0.4)) roastText = `I see you spent ${currency}${topSpend.toFixed(0)} on "${topCategory}". Is it made of solid gold?`;
      else if (totalExpenses === 0) roastText = `You haven't spent a single penny. Are you surviving on air?`;
      else if (savings < 0) roastText = `Spending more than you earn is a special kind of talent. Please stop.`;
      else roastText = `Your spending is... frustratingly responsible. Boring, but okay.`;
      setAiRoast(roastText);

      if (totalExpenses > 0) {
        const basePrediction = totalExpenses * 1.05; 
        setPredictedTotal(basePrediction);
        const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const top3Predictions = sortedCats.slice(0, 3).map(([cat, amount]) => ({ name: cat, amount: amount * (1 + (Math.random() * 0.1 - 0.02)) }));
        setPredictedCategories(top3Predictions);
      }
      setIsAILoading(false);
    }, 1500); 
  };

  const applyAIBudget = () => {
    const needs = income * 0.50; const wants = income * 0.30; 
    if(window.confirm(`Apply 50/30/20 Rule?\n\nNeeds: ${currency}${needs}\nWants: ${currency}${wants}\n\nThis will overwrite current budgets.`)) {
      setBudgets([{ id: Date.now(), category: 'Housing & Needs', limit: needs }, { id: Date.now() + 1, category: 'Wants & Lifestyle', limit: wants }]);
      setActiveTab("Budgets");
    }
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Financial Health</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{healthScore}/100</p>
            <p className="text-xs text-gray-400 mt-1">Savings & Discipline</p>
          </div>
          <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-black ${grade.bg} ${grade.color} shadow-inner`}>
            {grade.label}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{isEditingBalance ? "Edit Starting Balance" : "Total Balance"}</h3>
            {!isEditingBalance && <button onClick={() => setIsEditingBalance(true)} className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} /></button>}
          </div>
          {isEditingBalance ? (
            <div className="flex items-center mb-2">
              <span className="text-xl font-bold text-gray-800 dark:text-white mr-1">{currency}</span>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveBalance()} autoFocus className="text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-500 rounded outline-none w-32 px-2 py-1" />
              <button onClick={saveBalance} className="ml-3 text-white bg-green-500 hover:bg-green-600 p-1.5 rounded-md"><Check size={16} /></button>
            </div>
          ) : (
            <p className={`text-3xl font-bold mb-2 ${currentBalance < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{currency}{currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">{isEditingBalance ? "Enter money before expenses" : "Starting Balance - Expenses"}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Monthly Income</h3>
            {!isEditingIncome && <button onClick={() => setIsEditingIncome(true)} className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} /></button>}
          </div>
          {isEditingIncome ? (
            <div className="flex items-center mb-2">
              <span className="text-xl font-bold text-gray-800 dark:text-white mr-1">{currency}</span>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveIncome()} autoFocus className="text-2xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-500 rounded outline-none w-32 px-2 py-1" />
              <button onClick={saveIncome} className="ml-3 text-white bg-green-500 hover:bg-green-600 p-1.5 rounded-md"><Check size={16} /></button>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{currency}{parseFloat(income || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">Saved securely in browser</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-red-500 transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Real Tracked Expenses</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{currency}{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">From database</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto h-[250px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <tr className="text-gray-400 dark:text-gray-500 text-sm border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{item.date}</td>
                    <td className="py-3 text-sm text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-3 text-sm font-medium text-gray-600 dark:text-gray-300"><span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{item.title}</span></td>
                    <td className="py-3 text-sm text-red-500 font-bold">-{currency}{item.expense.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan="5" className="text-center py-6 text-gray-400">No transactions found.</td></tr>}
              </tbody>
            </table>
          </div>
          {expenses.length > 5 && <button onClick={() => setActiveTab("Transactions")} className="text-blue-500 text-sm mt-4 font-medium hover:underline">View All Transactions →</button>}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-6">Add New Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-all"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Name / Details</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Jio Recharge" required className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-all"/>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Food" list="category-suggestions" required className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-all"/>
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Amount ({currency})</label>
                <input type="number" name="expense" value={formData.expense} onChange={handleInputChange} step="0.01" placeholder="0.00" required className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-all"/>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 mt-2 text-white font-semibold text-sm bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">+ Save Expense</button>
          </form>
        </div>
      </div>
    </>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-5 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 col-span-2 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Spending by Category</h3>
        {categoryData.length > 0 ? (
          <div className="flex flex-col items-center h-[400px]">
            <div className="w-full h-[250px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#111827' }} itemStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full px-4 space-y-3 overflow-y-auto">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-3 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-white">{currency}{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center mt-10">No data to display. Add an expense!</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 col-span-3 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Expense Trend</h3>
        {monthlyData.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#374151" : "#f0f0f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12}} dx={-10} />
                <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#111827', borderRadius: '8px' }} itemStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }} />
                <Legend iconType="circle" wrapperStyle={{ top: -10, right: 0 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#FF6D00" strokeWidth={3} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
            <p className="text-gray-400 text-center mt-10">No data to display. Add an expense!</p>
        )}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full transition-colors">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">All Transactions</h3>
      <div className="overflow-x-auto h-[600px] overflow-y-auto pr-4">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10 transition-colors">
            <tr className="text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
              <th className="pb-4 font-semibold uppercase tracking-wider">Date</th>
              <th className="pb-4 font-semibold uppercase tracking-wider">Name</th>
              <th className="pb-4 font-semibold uppercase tracking-wider">Category</th>
              <th className="pb-4 font-semibold uppercase tracking-wider">Amount</th>
              <th className="pb-4 font-semibold uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-4 text-sm text-gray-600 dark:text-gray-300">{item.date}</td>
                <td className="py-4 text-sm text-gray-800 dark:text-gray-200 font-medium">{item.name}</td>
                <td className="py-4 text-sm text-gray-600 dark:text-gray-300"><span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{item.title}</span></td>
                <td className="py-4 text-sm text-red-500 font-bold">-{currency}{item.expense.toFixed(2)}</td>
                <td className="py-4 text-center">
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-gray-400">No transactions found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBudgets = () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 col-span-2 transition-colors">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <CreditCard className="mr-2 text-blue-500" size={24}/> Budget Management
        </h3>
        <div className="space-y-6">
          {budgetProgressData.map((item) => (
            <div key={item.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm transition-shadow">
              {editingBudgetId === item.id ? (
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <input type="text" value={editBudgetForm.category} onChange={(e) => setEditBudgetForm({...editBudgetForm, category: e.target.value})} list="category-suggestions" className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-blue-400"/>
                    <input type="number" value={editBudgetForm.limit} onChange={(e) => setEditBudgetForm({...editBudgetForm, limit: e.target.value})} className="w-28 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-blue-400"/>
                    <button onClick={handleSaveEditedBudget} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"><Check size={16}/></button>
                    <button onClick={handleCancelEditBudget} className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-gray-800 dark:text-white font-bold text-lg">{item.category}</span>
                    {item.percentage > 100 && <span className="ml-3 flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full"><AlertTriangle size={12} className="mr-1"/> OVER BUDGET</span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => startEditingBudget(item)} className="text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteBudget(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              )}
              
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden border border-gray-200 dark:border-gray-600">
                <div className={`h-full transition-all duration-500 ease-in-out ${item.colorClass}`} style={{ width: `${Math.min(item.percentage, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Spent: <span className={item.percentage > 100 ? 'text-red-500 font-bold' : 'text-gray-800 dark:text-white'}>{currency}{item.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></span>
                <span className="text-gray-400 dark:text-gray-500 font-medium">Limit: {currency}{item.limit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-0 transition-colors">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-6">Create New Budget</h3>
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Category Name</label>
            <input type="text" value={budgetForm.category} onChange={(e) => setBudgetForm({...budgetForm, category: e.target.value})} placeholder="e.g. Food" list="category-suggestions" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-blue-400 transition-all"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Monthly Limit ({currency})</label>
            <input type="number" value={budgetForm.limit} onChange={(e) => setBudgetForm({...budgetForm, limit: e.target.value})} step="0.01" placeholder="0.00" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-blue-400 transition-all"/>
          </div>
          <button type="submit" className="flex justify-center items-center w-full py-2.5 mt-2 text-white font-semibold text-sm bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"><Plus size={18} className="mr-1"/> Set Budget Limit</button>
        </form>
      </div>
    </div>
  );

  // --- NEW BILL SPLITTER RENDER FUNCTION ---
  const renderBillSplitter = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LEFT SIDE: Current Debts & Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
          <Users className="mr-2 text-indigo-500" size={24}/> Group Bill Splitter
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add who owes whom, and our algorithm will minimize the total transfers needed to settle up.</p>
        
        {/* Current Debts List */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Current Pending Debts</h4>
          <ul className="space-y-3">
            {debts.map((d) => (
              <li key={d.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {editingDebtId === d.id ? (
                  /* EDIT MODE UI */
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input type="text" value={editDebtForm.debtor} onChange={(e) => setEditDebtForm({...editDebtForm, debtor: e.target.value})} className="w-full sm:w-1/3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-1.5 rounded-md text-sm outline-none focus:border-indigo-400"/>
                    <span className="text-xs text-gray-500 hidden sm:block">owes</span>
                    <input type="text" value={editDebtForm.creditor} onChange={(e) => setEditDebtForm({...editDebtForm, creditor: e.target.value})} className="w-full sm:w-1/3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-1.5 rounded-md text-sm outline-none focus:border-indigo-400"/>
                    <input type="number" value={editDebtForm.amount} onChange={(e) => setEditDebtForm({...editDebtForm, amount: e.target.value})} className="w-full sm:w-1/4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-1.5 rounded-md text-sm outline-none focus:border-indigo-400" step="0.01"/>
                    <div className="flex gap-1 w-full sm:w-auto justify-end">
                      <button onClick={handleSaveEditedDebt} className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded transition-colors"><Check size={16}/></button>
                      <button onClick={handleCancelEditDebt} className="bg-gray-400 hover:bg-gray-500 text-white p-1.5 rounded transition-colors"><X size={16}/></button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD DISPLAY UI */
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-bold">{d.debtor}</span> owes <span className="font-bold">{d.creditor}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500">₹{d.amount}</span>
                      <button onClick={() => startEditingDebt(d)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Edit Debt"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteDebt(d.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete Debt"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {debts.length === 0 && <p className="text-sm text-gray-400 italic">No debts added yet.</p>}
          </ul>
        </div>

        {/* Add New Debt Form */}
        <form onSubmit={handleAddDebt} className="space-y-4 bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-400 mb-2">Add a Debt</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Who owes?</label>
              <input type="text" value={debtForm.debtor} onChange={(e) => setDebtForm({...debtForm, debtor: e.target.value})} placeholder="e.g. Rahul" required className="w-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">To Whom?</label>
              <input type="text" value={debtForm.creditor} onChange={(e) => setDebtForm({...debtForm, creditor: e.target.value})} placeholder="e.g. You" required className="w-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-400"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Amount</label>
            <input type="number" value={debtForm.amount} onChange={(e) => setDebtForm({...debtForm, amount: e.target.value})} step="0.01" placeholder="0.00" required className="w-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-400"/>
          </div>
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition">Add to List</button>
        </form>
      </div>

      {/* RIGHT SIDE: The Optimizer */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-0 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Algorithm Result</h3>
        
        <button 
          onClick={handleOptimizeDebts}
          disabled={isOptimizing}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all mb-6 flex items-center justify-center disabled:opacity-70"
        >
          {isOptimizing ? "Running Graph Algorithm..." : "Optimize Settlements"}
        </button>

        {settlements.length > 0 ? (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-5 rounded-xl">
            <h4 className="font-semibold text-green-800 dark:text-green-400 mb-4 text-center">✅ Optimized Payment Plan</h4>
            <div className="space-y-4">
              {settlements.map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-green-800/50">
                  <p className="text-gray-800 dark:text-gray-200 font-medium text-center">
                    <span className="text-red-500 font-bold">{s.from}</span> pays <span className="text-green-500 font-bold">{s.to}</span> 
                    <span className="font-black ml-1">₹{s.amount.toFixed(2)}</span>
                  </p>
                  
                  {/* Magic WhatsApp Button (Shows when someone owes "You") */}
                  {(s.to.toLowerCase() === 'you' || s.to.toLowerCase() === userName.split(' ')[0].toLowerCase()) && (
                    <WhatsAppSplitButton 
                      friendName={s.from} 
                      amountOwed={s.amount.toFixed(2)} 
                      upiId="your_upi_id@okicici" // Replace with your actual UPI ID
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-green-600 dark:text-green-500 mt-4 opacity-70">Debts minimized successfully!</p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400">
            <BrainCircuit size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click the button above to calculate the most efficient way to settle everyone's debts.</p>
          </div>
        )}
      </div>

    </div>
  );

  const renderAIAdvisor = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <BrainCircuit className="absolute -top-10 -right-10 text-white opacity-10" size={150} />
        <h2 className="text-3xl font-bold mb-2 flex items-center"><Sparkles className="mr-3 text-yellow-300"/> AI Financial Advisor</h2>
        <p className="text-indigo-100 max-w-2xl">I analyze your spending habits, generate optimal budgets, and predict your future expenses so you don't have to. Click below to run my latest analysis.</p>
        
        <button onClick={runAIAnalysis} disabled={isAILoading} className="mt-6 bg-white text-indigo-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-indigo-50 transition-all disabled:opacity-70 flex items-center">
          {isAILoading ? "Running Calculations..." : "Run AI Analysis Now"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center"><TrendingUp className="mr-2 text-green-500"/> Smart Insights</h3>
          <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[140px]">
            {isAILoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            ) : aiInsights ? (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{aiInsights}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">Click the run button above to generate insights based on your recent transactions.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Flame className="mr-2 text-orange-500"/> Roast My Wallet</h3>
          <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-xl border border-orange-100 dark:border-orange-900/30 min-h-[140px] flex items-center">
            {isAILoading ? (
              <div className="animate-pulse space-y-3 w-full">
                <div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-full"></div><div className="h-4 bg-orange-200 dark:bg-orange-800/50 rounded w-4/5"></div>
              </div>
            ) : aiRoast ? (
              <p className="text-orange-800 dark:text-orange-300 font-medium leading-relaxed italic text-sm">"{aiRoast}"</p>
            ) : (
              <p className="text-orange-400/70 italic text-sm text-center w-full">Warning: The AI can be brutally honest about your bad financial decisions.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Activity className="mr-2 text-blue-500"/> Next Month Forecast</h3>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 min-h-[160px]">
            {isAILoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-3 bg-blue-200 dark:bg-blue-800/50 rounded w-1/2"></div>
                <div className="h-8 bg-blue-200 dark:bg-blue-800/50 rounded w-1/3"></div>
                <div className="h-3 bg-blue-200 dark:bg-blue-800/50 rounded w-full mt-4"></div>
              </div>
            ) : predictedTotal > 0 ? (
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-1">Est. Total Expenses</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-4">{currency}{predictedTotal.toFixed(0)}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Highest Predicted Categories:</p>
                <ul className="space-y-1.5">
                  {predictedCategories.map((cat, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b border-blue-100 dark:border-blue-900/50 pb-1 last:border-0">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{cat.name}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{currency}{cat.amount.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-blue-400/70 italic text-sm mt-4 text-center">Add some expenses and click run so I can mathematically predict your future spending.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center"><Wand2 className="mr-2 text-purple-500"/> Auto-Budget Generator</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Calculates perfect limits using the 50/30/20 rule based on your income ({currency}{income}).</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-100 dark:border-blue-800/50">
                 <p className="text-[10px] font-bold text-blue-500 uppercase">50% Needs</p>
                 <p className="text-base font-bold text-blue-700 dark:text-blue-300">{currency}{(income * 0.5).toFixed(0)}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-center border border-purple-100 dark:border-purple-800/50">
                 <p className="text-[10px] font-bold text-purple-500 uppercase">30% Wants</p>
                 <p className="text-base font-bold text-purple-700 dark:text-purple-300">{currency}{(income * 0.3).toFixed(0)}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-100 dark:border-green-800/50">
                 <p className="text-[10px] font-bold text-green-500 uppercase">20% Save</p>
                 <p className="text-base font-bold text-green-700 dark:text-green-300">{currency}{(income * 0.2).toFixed(0)}</p>
              </div>
            </div>
          </div>
          <button onClick={applyAIBudget} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-white transition-colors text-sm shadow-md">
            Apply Recommendations
          </button>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <Target className="mr-2 text-purple-500" size={24}/> My Savings Goals
        </h3>
        <div className="space-y-6">
          {goals.map((goal) => {
            const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
            return (
              <div key={goal.id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm transition-shadow bg-gray-50 dark:bg-gray-800/40">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-800 dark:text-white font-bold text-lg">{goal.name}</span>
                  <div className="flex gap-3 items-center">
                    <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full text-sm">
                      {Math.round(progress)}%
                    </span>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 mb-3 overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner">
                   <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                   <span className="font-semibold text-gray-700 dark:text-gray-300">{currency}{goal.saved.toLocaleString()} saved</span>
                   <span>Goal: {currency}{goal.target.toLocaleString()}</span>
                </div>
                
                <button onClick={() => handleAddFundsPrompt(goal.id, goal.name)} className="w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold rounded-lg text-sm border border-purple-200 dark:border-purple-800/50 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex justify-center items-center">
                  <Plus size={16} className="mr-1" /> Add Funds
                </button>
              </div>
            );
          })}
          {goals.length === 0 && <p className="text-gray-500 italic text-center py-6">No goals set yet. Time to start saving!</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-0 transition-colors">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-400 mb-6">Create New Goal</h3>
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Goal Name</label>
            <input type="text" value={goalForm.name} onChange={(e) => setGoalForm({...goalForm, name: e.target.value})} placeholder="e.g. Vacation" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-purple-400 transition-all"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Target Amount ({currency})</label>
            <input type="number" value={goalForm.target} onChange={(e) => setGoalForm({...goalForm, target: e.target.value})} step="0.01" placeholder="0.00" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-purple-400 transition-all"/>
          </div>
          <button type="submit" className="flex justify-center items-center w-full py-2.5 mt-2 text-white font-semibold text-sm bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
            <Plus size={18} className="mr-1"/> Set Goal
          </button>
        </form>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
          <Repeat className="mr-2 text-rose-500" size={24}/> The Subscription Graveyard
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">These are the recurring bills quietly draining your account every month.</p>
        
        <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-xl border border-rose-100 dark:border-rose-900/50 mb-6 flex justify-between items-center">
           <div>
             <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Total Yearly Burn Rate</p>
             <p className="text-xs text-rose-500/70 dark:text-rose-400/70 mt-1">What these cost you over 12 months</p>
           </div>
           <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{currency}{yearlyBurnRate.toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm bg-gray-50 dark:bg-gray-800/40">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mr-4">
                  <Repeat size={18} />
                </div>
                <span className="text-gray-800 dark:text-white font-bold">{sub.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">{currency}{sub.amount}/mo</span>
                  <span className="text-xs text-gray-400 font-medium">({currency}{sub.amount * 12}/yr)</span>
                </div>
                <button onClick={() => handleDeleteSubscription(sub.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && <p className="text-gray-500 text-center py-4">No subscriptions found. Great job!</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-0 transition-colors">
        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400 mb-6">Add Recurring Bill</h3>
        <form onSubmit={handleAddSubscription} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Service Name</label>
            <input type="text" value={subForm.name} onChange={(e) => setSubForm({...subForm, name: e.target.value})} placeholder="e.g. Spotify" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-rose-400 transition-all"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Monthly Cost ({currency})</label>
            <input type="number" value={subForm.amount} onChange={(e) => setSubForm({...subForm, amount: e.target.value})} step="0.01" placeholder="0.00" required className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm outline-none focus:border-rose-400 transition-all"/>
          </div>
          <button type="submit" className="w-full py-2.5 mt-2 text-white font-semibold text-sm bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm">+ Track Subscription</button>
        </form>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Account Settings</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Tag className="mr-2 text-blue-500" size={20}/> Manage Custom Categories</h3>
        <div className="flex flex-wrap gap-2">
          {customCategories.length === 0 ? <p className="text-sm text-gray-400 italic">No custom categories added yet.</p> : customCategories.map(cat => (
            <span key={cat} className="flex items-center bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100 dark:border-gray-600"><button onClick={() => handleDeleteCustomCategory(cat)} className="mr-2 text-red-400 hover:text-red-500"><Trash2 size={14}/></button>{cat}</span>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center"><User className="mr-2 text-blue-500" size={20}/> Profile & Preferences</h3>
        <div className="space-y-4 max-w-md">
          <div><label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Display Name</label><input type="text" value={tempUserName} onChange={(e) => setTempUserName(e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm" /></div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Currency Symbol</label>
            <select value={tempCurrency} onChange={(e) => setTempCurrency(e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2.5 rounded-lg text-sm">
              <option value="₹">₹ (INR - Indian Rupee)</option><option value="$">$ (USD - US Dollar)</option><option value="€">€ (EUR - Euro)</option><option value="£">£ (GBP - British Pound)</option>
            </select>
          </div>
          <button onClick={handleSaveSettings} className="flex items-center justify-center w-full py-2.5 mt-4 text-white font-semibold text-sm bg-blue-600 rounded-xl hover:bg-blue-700"><Save size={18} className="mr-2"/> Save Settings</button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Download className="mr-2 text-blue-500" size={20}/> Data Management</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={generatePDFReport} className="flex items-center justify-center py-2.5 px-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/30 transition-colors"><FileText size={18} className="mr-2"/> Download PDF Report</button>
          <button onClick={exportToCSV} className="flex items-center justify-center py-2.5 px-6 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-100 dark:hover:bg-gray-600 border border-blue-100 dark:border-gray-600 transition-colors"><Download size={18} className="mr-2"/> Export Data (CSV)</button>
          <button onClick={clearAllData} className="flex items-center justify-center py-2.5 px-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30 transition-colors"><AlertTriangle size={18} className="mr-2"/> Wipe All Data</button>
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950 items-center justify-center font-sans transition-colors">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-96 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-3 rounded-xl mb-4 text-white shadow-md"><Lock size={32} /></div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your Expense Tracker</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Email Address</label>
              <input type="email" required placeholder="admin@example.com" className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Password</label>
              <input type="password" required placeholder="••••••••" className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all" />
            </div>
            <button type="submit" className="w-full py-3 mt-4 text-white font-bold text-sm bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-950 font-sans transition-colors ${isDarkMode ? 'dark' : ''}`}>
      
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="relative">
            <ScanLine size={64} className="animate-pulse text-blue-400" />
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-wider">Processing Receipt...</h2>
          <p className="text-gray-400 text-sm mt-2">Extracting vendor, date, and amount</p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <div className="bg-blue-900 dark:bg-slate-900 text-white w-64 flex flex-col h-screen p-4 z-10 border-r border-transparent dark:border-slate-800 transition-colors">
        <div className="flex items-center mb-8 mt-2">
          <CreditCard className="mr-3 text-blue-300 dark:text-blue-400" size={28} />
          <h1 className="text-xl font-bold tracking-wide">Expense Tracker</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isAI = tab.id === 'AI Advisor';
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${isActive && !isAI ? 'bg-blue-700 dark:bg-slate-800 font-semibold shadow-sm text-white' : isActive && isAI ? 'bg-gradient-to-r from-indigo-600 to-purple-600 font-bold shadow-md text-white' : 'hover:bg-blue-800 dark:hover:bg-slate-800/50 text-blue-100 dark:text-slate-300'}`}>
                <Icon className={`mr-3 ${isActive ? 'text-white' : 'text-blue-300 dark:text-slate-400'} ${isAI && !isActive ? 'text-yellow-300' : ''}`} size={20} /> 
                {tab.id}
              </button>
            )
          })}
        </nav>
        
        <div className="mt-auto mb-4 border-t border-blue-800 dark:border-slate-800 pt-4">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center p-3 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-lg transition-colors text-left font-medium cursor-pointer relative z-50"
          >
            <LogOut className="mr-3" size={20} /> 
            Log Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white dark:bg-gray-900 p-4 flex justify-between items-center shadow-sm dark:shadow-none z-30 relative border-b border-transparent dark:border-gray-800 transition-colors">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 w-96 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
            <Search className="text-gray-400 dark:text-gray-500 mr-2" size={18} />
            <input type="text" placeholder="Search by name or category..." value={search} onChange={(e) => { setSearch(e.target.value); fetchExpenses(e.target.value); }} className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200" />
          </div>
          
          <div className="flex items-center space-x-5 text-gray-500 dark:text-gray-400">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>

            <button onClick={handleScanClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 transition-colors" title="Scan Receipt">
              <ScanLine size={20} />
            </button>

            <div className="relative">
              <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }} className="relative cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none flex items-center">
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900">{notifications.length}</span>}
              </button>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200 text-sm">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((note, idx) => (
                          <div key={idx} className="p-4 border-b border-gray-50 dark:border-gray-700 text-sm flex items-start gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                            <span className={note.type === 'critical' ? 'text-red-600 dark:text-red-400 font-semibold' : note.type === 'danger' ? 'text-red-500 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>{note.text}</span>
                          </div>
                        )) : <div className="p-4 text-sm text-gray-500 text-center"><Check className="text-green-500 mb-2 mx-auto" size={24}/> You're looking good!</div>}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="relative">
              <div onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 pr-3 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full p-1.5"><User size={18} /></div>
                 <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{userName.split(' ')[0]}</span>
              </div>
              {isProfileOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                     <button onClick={() => { setActiveTab("Settings"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center"><Settings size={16} className="mr-2" /> Account Settings</button>
                     <button 
                       onClick={handleLogout} 
                       className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center"
                     >
                       <LogOut size={16} className="mr-2" /> 
                       Log Out
                     </button>
                   </div>
                 </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative z-0">
          <datalist id="category-suggestions">
            {suggestedCategories.map((cat, index) => <option key={index} value={cat} />)}
          </datalist>

          {activeTab === "Dashboard" && renderDashboard()}
          {activeTab === "Transactions" && renderTransactions()}
          {activeTab === "Analytics" && renderAnalytics()}
          {activeTab === "Budgets" && renderBudgets()}
          {activeTab === "Groups" && renderBillSplitter()}
          {activeTab === "AI Advisor" && renderAIAdvisor()}
          {activeTab === "Goals" && renderGoals()}
          {activeTab === "Subscriptions" && renderSubscriptions()}
          {activeTab === "Settings" && renderSettings()}
        </main>

      </div>
    </div>
  );
}