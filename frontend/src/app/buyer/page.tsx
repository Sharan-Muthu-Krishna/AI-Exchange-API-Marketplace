'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface DashboardData {
  wallet_balance: number;
  active_subscriptions: number;
  total_api_calls: number;
  total_spent: number;
  active_api_keys: number;
}

export default function BuyerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: dashboardData } = await api.getBuyerDashboard();
      if (dashboardData) {
        setData(dashboardData as DashboardData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Credit Balance</div>
                <div className="text-3xl font-bold text-green-400">{data.wallet_balance.toFixed(2)}</div>
                <a href="/buyer/credits" className="text-sm text-indigo-400 mt-2 inline-block">+ Add Credits</a>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Active Subscriptions</div>
                <div className="text-3xl font-bold text-indigo-400">{data.active_subscriptions}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Total API Calls</div>
                <div className="text-3xl font-bold">{data.total_api_calls.toLocaleString()}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">API Keys</div>
                <div className="text-3xl font-bold">{data.active_api_keys}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/buyer/marketplace" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl">🛒</div>
                  <div>
                    <div className="font-semibold">Browse Marketplace</div>
                    <div className="text-sm text-gray-400">Discover new APIs</div>
                  </div>
                </a>
                <a href="/buyer/keys" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl">🔑</div>
                  <div>
                    <div className="font-semibold">Manage API Keys</div>
                    <div className="text-sm text-gray-400">Create or revoke keys</div>
                  </div>
                </a>
                <a href="/buyer/credits" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl">💳</div>
                  <div>
                    <div className="font-semibold">Purchase Credits</div>
                    <div className="text-sm text-gray-400">Top up your balance</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Getting Started */}
            {data.active_subscriptions === 0 && (
              <div className="glass-card p-8 text-center glow">
                <div className="text-4xl mb-4">🚀</div>
                <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                <p className="text-gray-400 mb-6">Subscribe to your first API to start integrating</p>
                <a href="/buyer/marketplace" className="gradient-btn px-6 py-3 rounded-xl inline-block text-white font-medium">
                  Browse Marketplace
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400">Failed to load dashboard data</div>
        )}
      </div>
    </DashboardLayout>
  );
}
