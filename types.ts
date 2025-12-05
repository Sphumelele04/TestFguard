export type ViewState = 'dashboard' | 'transactions' | 'scanner' | 'voice';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  status: 'pending' | 'cleared' | 'flagged' | 'declined';
  riskScore: number; // 0-100
  riskReason?: string;
  description?: string;
}

export interface AnalysisResponse {
  merchant: string;
  total: number;
  date: string;
  items: string[];
  category: string;
  suspicionLevel: number; // 0-100
  reasoning: string;
}

export enum GeminiModel {
  TEXT = 'gemini-2.5-flash',
  VISION = 'gemini-2.5-flash', // Vision is supported in Flash 2.5
  LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025'
}