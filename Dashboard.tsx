import React from 'react';
import { Transaction } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ArrowUpRight, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onNavigate }) => {
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const flaggedCount = transactions.filter(t => t.riskScore > 50).length;
  
  // Prepare chart data
  const data = transactions.slice(0, 5).reverse().map(t => ({
    name: t.merchant.substring(0, 10),
    amount: t.amount,
    risk: t.riskScore
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">Security Overview</h1>
        <p className="text-slate-400 font-medium">Monitoring real-time transaction threats.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl hover:bg-white/10 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Flagged Risks</p>
              <h3 className="text-3xl font-bold text-white mt-1">{flaggedCount}</h3>
            </div>
            <div className={`p-3 rounded-xl shadow-lg ${flaggedCount > 0 ? 'bg-red-500/20 text-red-400 shadow-red-500/10' : 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Requires immediate attention</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl hover:bg-white/10 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Safe Transactions</p>
              <h3 className="text-3xl font-bold text-white mt-1">{transactions.length - flaggedCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShieldCheck size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Verified by FraudGuard AI</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl hover:bg-white/10 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Total Volume</p>
              <h3 className="text-3xl font-bold text-white mt-1">R {totalSpent.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10">
              <Activity size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Last 30 days</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Risk Analysis</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '12px' }}
                  formatter={(value: number) => [`R ${value}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 50 ? '#ef4444' : '#10b981'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
          
          <div className="bg-emerald-500/10 p-5 rounded-full mb-6 ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
             <ShieldCheck size={48} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">System Protected</h3>
          <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
            Language, Vision, and Voice AI modules are active and monitoring transactions in real-time.
          </p>
          <button 
            onClick={() => onNavigate('voice')}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
          >
            Start Voice Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;