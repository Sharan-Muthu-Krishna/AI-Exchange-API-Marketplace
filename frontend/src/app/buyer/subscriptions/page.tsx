'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface SubscriptionItem {
  id: string;
  buyer_id: string;
  api_id: string;
  is_active: boolean;
  created_at: string;
  api_name: string;
  api_price: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await api.getSubscriptions();
      if (data) {
        setSubscriptions(data as SubscriptionItem[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCancel = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    const { error } = await api.cancelSubscription(subId);
    if (!error) {
      setSubscriptions(subscriptions.map(s => 
        s.id === subId ? { ...s, is_active: false } : s
      ));
    }
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Subscriptions</h1>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
              <p className="text-gray-400 mb-6">Subscribe to APIs from the marketplace</p>
              <a href="/buyer/marketplace" className="gradient-btn px-6 py-3 rounded-xl inline-block text-white font-medium">
                Browse Marketplace
              </a>
            </div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>API</th>
                  <th>Gateway URL</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="font-medium">{sub.api_name}</td>
                    <td>
                      <code className="text-xs text-indigo-400 bg-gray-900 px-2 py-1 rounded">
                        /v1/apis/{sub.api_id}/run
                      </code>
                    </td>
                    <td>
                      <span className="font-mono">{sub.api_price} credits</span>
                    </td>
                    <td>
                      <span className={`badge ${sub.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {sub.is_active ? 'Active' : 'Cancelled'}
                      </span>
                    </td>
                    <td>
                      {sub.is_active && (
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="px-3 py-1.5 rounded-lg text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
                        >
                          Cancel
                        </button>
                      )}
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
