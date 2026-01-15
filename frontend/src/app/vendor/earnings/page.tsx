'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  buyer_id: string;
  vendor_id: string;
  api_id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

interface EarningsSummary {
  balance: number;
  total_earned: number;
  recent_transactions: Transaction[];
}

export default function VendorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data } = await api.getVendorEarnings();
      if (data) {
        setSummary(data as EarningsSummary);
      }
      setLoading(false);
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="vendor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Earnings</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-gray-400 text-sm mb-2">Current Balance</div>
            <div className="text-4xl font-bold gradient-text">
              ${summary?.balance.toFixed(2) || '0.00'}
            </div>
            <p className="text-gray-500 text-sm mt-2">Available for withdrawal</p>
          </div>
          <div className="glass-card p-6">
            <div className="text-gray-400 text-sm mb-2">Total Earned</div>
            <div className="text-4xl font-bold text-green-400">
              ${summary?.total_earned.toFixed(2) || '0.00'}
            </div>
            <p className="text-gray-500 text-sm mt-2">All-time earnings (after platform fee)</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
          </div>
          
          {!summary?.recent_transactions?.length ? (
            <div className="p-8 text-center text-gray-400">No transactions yet</div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-gray-400 text-sm">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'CREDIT' ? 'badge-success' : 'badge-info'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-gray-300">{tx.description || '-'}</td>
                    <td className={`font-mono ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-gray-400'}`}>
                      {tx.type === 'CREDIT' ? '+' : ''}{tx.amount.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Commission Info */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Fee</h3>
          <p className="text-gray-400">
            AIExchange charges a <span className="text-indigo-400 font-medium">10% platform fee</span> on each API call.
            The remaining 90% is credited to your wallet balance.
          </p>
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-500">Example:</div>
            <div className="text-gray-300 mt-1">
              If a buyer pays <span className="text-white">1.00 credits</span> for an API call, 
              you receive <span className="text-green-400">0.90 credits</span> (90%).
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
