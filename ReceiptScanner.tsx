import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { analyzeReceiptImage } from '../services/geminiService';
import { Transaction } from '../types';

interface ReceiptScannerProps {
  onScanComplete: (transaction: Transaction) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      processImage(base64String, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data: string, mimeType: string) => {
    setIsAnalyzing(true);
    // Remove data URL prefix
    const base64Content = base64Data.split(',')[1];
    
    try {
      const result = await analyzeReceiptImage(base64Content, mimeType);
      
      const newTransaction: Transaction = {
        id: `scan_${Date.now()}`,
        merchant: result.merchant || "Unknown Merchant",
        amount: result.total || 0,
        date: result.date || new Date().toISOString().split('T')[0],
        category: result.category || "Misc",
        status: result.suspicionLevel > 50 ? 'flagged' : 'cleared',
        riskScore: result.suspicionLevel,
        riskReason: result.reasoning,
        description: `Items: ${result.items?.join(', ')}`
      };

      onScanComplete(newTransaction);
    } catch (err) {
      setError("Failed to analyze receipt. Please try again with a clearer image.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">Vision AI Scanner</h2>
        <p className="text-slate-400">Upload a receipt or invoice. FraudGuard will extract details and detect tampering.</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="space-y-1">
              <p className="text-white font-medium">Analyzing Receipt Structure...</p>
              <p className="text-sm text-slate-400">Checking for fraud patterns</p>
            </div>
          </div>
        ) : imagePreview ? (
          <div className="relative z-20">
             <img src={imagePreview} alt="Receipt Preview" className="max-h-64 mx-auto rounded-xl shadow-2xl mb-6 opacity-80 group-hover:opacity-100 transition-opacity border border-white/10" />
             <p className="text-emerald-400 font-medium flex items-center justify-center gap-2 bg-emerald-500/10 py-2 px-4 rounded-full w-fit mx-auto border border-emerald-500/20 backdrop-blur-md">
               <CheckCircle size={16} /> Analysis Complete
             </p>
             <p className="text-xs text-slate-500 mt-4">Click anywhere to scan another</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300 shadow-xl border border-white/5">
              <Camera size={40} />
            </div>
            <div>
              <p className="text-xl font-semibold text-white group-hover:text-emerald-300 transition-colors">Tap to Capture or Upload</p>
              <p className="text-sm text-slate-400 mt-2">Supports JPG, PNG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center space-x-3 shadow-lg">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <div className="text-emerald-400 font-bold mb-2 text-lg">01. Scan</div>
            <p className="text-sm text-slate-400 leading-relaxed">Gemini Vision extracts merchant, date, and total amount instantly.</p>
          </div>
          <div className="p-5 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <div className="text-emerald-400 font-bold mb-2 text-lg">02. Verify</div>
            <p className="text-sm text-slate-400 leading-relaxed">AI cross-references the image against transaction history.</p>
          </div>
          <div className="p-5 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <div className="text-emerald-400 font-bold mb-2 text-lg">03. Detect</div>
            <p className="text-sm text-slate-400 leading-relaxed">Visual anomalies (edits, fonts) are flagged as potential fraud.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;