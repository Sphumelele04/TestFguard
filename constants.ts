import { Transaction } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    merchant: 'Apple Store',
    amount: 1299.00,
    date: '2023-10-25',
    category: 'Electronics',
    status: 'flagged',
    riskScore: 85,
    riskReason: 'Unusual high value transaction in a different location than usual.',
    description: 'Purchase of MacBook Air M2'
  },
  {
    id: 'tx_2',
    merchant: 'Starbucks',
    amount: 12.50,
    date: '2023-10-24',
    category: 'Dining',
    status: 'cleared',
    riskScore: 5,
    riskReason: 'Consistent with user history.',
    description: 'Coffee and bagel'
  },
  {
    id: 'tx_3',
    merchant: 'Unknown Vendor #8832',
    amount: 450.00,
    date: '2023-10-23',
    category: 'Services',
    status: 'flagged',
    riskScore: 92,
    riskReason: 'Vendor not recognized, round number amount usually suspicious.',
    description: 'Service charge'
  },
  {
    id: 'tx_4',
    merchant: 'Uber',
    amount: 24.30,
    date: '2023-10-22',
    category: 'Transport',
    status: 'cleared',
    riskScore: 10,
    riskReason: 'Regular commuting pattern.',
    description: 'Ride to downtown'
  },
  {
    id: 'tx_5',
    merchant: 'Amazon Web Services',
    amount: 64.12,
    date: '2023-10-20',
    category: 'Software',
    status: 'cleared',
    riskScore: 2,
    riskReason: 'Recurring subscription.',
    description: 'Monthly hosting bill'
  }
];

export const SYSTEM_INSTRUCTION_VOICE = `
You are FraudGuard, an advanced security assistant for a banking application. 
Your tone is professional, calm, and authoritative yet helpful.
Your primary goal is to help the user verify their identity and review suspicious transactions.
If the user asks about recent fraud, mention they have a high-value transaction at the Apple Store pending review.
Keep responses concise and spoken-style.
`;