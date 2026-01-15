'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface BuyerItem {
  id: string;
  user_id: string;
  email: string;
  wallet_balance: number;
  created_at: string;
}

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<BuyerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyers = async () => {
      const { data } = await api.getAdminBuyers();
      if (data) {
        setBuyers(data as BuyerItem[]);
      }
      setLoading(false);
    };
    fetchBuyers();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Buyers</h1>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : buyers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No buyers registered yet</div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Email</th>
                  <th>Credit Balance</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td className="font-medium">{buyer.email}</td>
                    <td>
                      <span className="text-green-400">{Number(buyer.wallet_balance).toFixed(2)} credits</span>
                    </td>
                    <td className="text-gray-400">
                      {new Date(buyer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
