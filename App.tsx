import React, { useState, useEffect } from 'react';
import { ShieldAlert, Receipt, Mic, LayoutDashboard, PlusCircle, Bell } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import VoiceGuard from './components/VoiceGuard';
import TransactionList from './components/TransactionList';
import { Transaction, ViewState } from './types';
import { INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Calculate stats for the header
  const fraudCount = transactions.filter(t => t.riskScore > 70).length;

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    setNotifications(prev => [`New transaction added: ${newTx.merchant}`, ...prev]);
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} onNavigate={setCurrentView} />;
      case 'transactions':
        return <TransactionList transactions={transactions} onUpdate={handleUpdateTransaction} />;
      case 'scanner':
        return <ReceiptScanner onScanComplete={handleAddTransaction} />;
      case 'voice':
        return <VoiceGuard />;
      default:
        return <Dashboard transactions={transactions} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900/70 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg tracking-tight">FraudGuard</span>
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-slate-400" />
          {fraudCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/50">
              {fraudCount}
            </span>
          )}
        </div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-900/40 backdrop-blur-2xl border-r border-white/10 p-4 h-screen sticky top-0 shadow-2xl">
        <div className="flex items-center space-x-2 mb-8 px-2 pt-2">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">FraudGuard</span>
        </div>
        
        <div className="space-y-2 flex-1">
          <NavButton 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
          />
          <NavButton 
            active={currentView === 'transactions'} 
            onClick={() => setCurrentView('transactions')} 
            icon={<ShieldAlert />} 
            label="Transactions" 
          />
          <NavButton 
            active={currentView === 'scanner'} 
            onClick={() => setCurrentView('scanner')} 
            icon={<Receipt />} 
            label="Vision Scanner" 
          />
          <NavButton 
            active={currentView === 'voice'} 
            onClick={() => setCurrentView('voice')} 
            icon={<Mic />} 
            label="Voice Guard" 
          />
        </div>

        <div className="mt-auto p-4 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">System Status</h3>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-emerald-400">AI Models Online</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8 scroll-smooth">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex justify-around p-3 z-30 safe-area-bottom">
        <MobileNavIcon active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <MobileNavIcon active={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} icon={<ShieldAlert />} label="Alerts" />
        <div className="relative -top-6">
          <button 
            onClick={() => setCurrentView('scanner')}
            className="bg-gradient-to-tr from-emerald-500 to-teal-400 text-white p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all transform hover:scale-105"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>
        <MobileNavIcon active={currentView === 'voice'} onClick={() => setCurrentView('voice')} icon={<Mic />} label="Voice" />
        <MobileNavIcon active={currentView === 'scanner'} onClick={() => setCurrentView('scanner')} icon={<Receipt />} label="Scan" />
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-emerald-500/10 backdrop-blur-sm text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavIcon = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center space-y-1 ${active ? 'text-emerald-400' : 'text-slate-500'}`}
  >
    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;