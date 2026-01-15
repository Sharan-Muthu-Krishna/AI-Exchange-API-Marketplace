'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface CreditsData {
  balance: number;
  total_spent: number;
  recent_transactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export default function CreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [amount, setAmount] = useState(100);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: creditsData } = await api.getCredits();
    if (creditsData) {
      setData(creditsData as CreditsData);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    const { error } = await api.purchaseCredits(amount);
    if (!error) {
      await fetchData();
    }
    setPurchasing(false);
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Credits</h1>

        {loading ? (
          <div className="glass-card p-8 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : data ? (
          <>
            {/* Balance Card */}
            <div className="glass-card p-8 mb-8 glow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-400 mb-2">Current Balance</div>
                  <div className="text-5xl font-bold gradient-text">{data.balance.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mt-2">credits</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 mb-2">Total Spent</div>
                  <div className="text-2xl font-bold text-red-400">{data.total_spent.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Purchase Section */}
            <div className="glass-card p-8 mb-8">
              <h2 className="text-xl font-semibold mb-6">Purchase Credits</h2>
              <div className="flex flex-wrap gap-4 mb-6">
                {[50, 100, 250, 500, 1000].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`px-6 py-3 rounded-xl font-medium transition ${
                      amount === value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {value} credits
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  className="w-40"
                />
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || amount <= 0}
                  className="gradient-btn px-8 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                >
                  {purchasing ? 'Processing...' : `Purchase ${amount} Credits`}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                💡 This is a simulated purchase for demonstration purposes.
              </p>
            </div>

            {/* Transaction History */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="font-semibold">Recent Transactions</h2>
              </div>
              {data.recent_transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No transactions yet</div>
              ) : (
                <table>
                  <thead>
                    <tr className="bg-gray-900/50">
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-gray-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td>{tx.description}</td>
                        <td>
                          <span className={`badge ${
                            tx.type === 'PURCHASE' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={tx.type === 'PURCHASE' ? 'text-green-400' : 'text-red-400'}>
                          {tx.type === 'PURCHASE' ? '+' : '-'}{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">Failed to load credits data</div>
        )}
      </div>
    </DashboardLayout>
  );
}
