import React, { useState } from 'react';
import { Transaction } from '../types';
import { AlertTriangle, CheckCircle, Search, RefreshCw, XCircle } from 'lucide-react';
import { analyzeTransactionText } from '../services/geminiService';

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onUpdate }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleDeepScan = async (transaction: Transaction) => {
    setAnalyzingId(transaction.id);
    try {
      const result = await analyzeTransactionText(`${transaction.merchant} ${transaction.amount} ${transaction.category} ${transaction.description || ''}`);
      onUpdate(transaction.id, {
        riskScore: result.riskScore,
        riskReason: result.reason,
        status: result.riskScore > 50 ? 'flagged' : 'cleared'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">Transaction Log</h2>
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-hover:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-600/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none w-64 transition-all hover:bg-slate-900/70"
          />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/40 text-slate-200 uppercase font-semibold tracking-wider text-xs">
              <tr>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Merchant</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Risk Score</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors duration-150">
                  <td className="px-6 py-4">
                    {t.status === 'flagged' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        <AlertTriangle className="w-3 h-3 mr-1.5" /> Flagged
                      </span>
                    ) : t.status === 'cleared' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <CheckCircle className="w-3 h-3 mr-1.5" /> Safe
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{t.merchant}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.category}</div>
                  </td>
                  <td className="px-6 py-4">{t.date}</td>
                  <td className="px-6 py-4 font-mono text-white tracking-wide">R {t.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 w-20">
                        <div 
                            className={`h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${t.riskScore > 50 ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`} 
                            style={{ width: `${t.riskScore}%` }}
                        ></div>
                        </div>
                        <span className={`text-xs font-medium ${t.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{t.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeepScan(t)}
                      disabled={analyzingId === t.id}
                      className="text-emerald-400 hover:text-emerald-300 font-medium text-xs flex items-center space-x-1 disabled:opacity-50 transition-colors"
                    >
                      {analyzingId === t.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <span>AI Re-Scan</span>
                      )}
                    </button>
                    {t.riskReason && (
                       <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] leading-tight opacity-80">{t.riskReason}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;