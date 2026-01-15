'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface DashboardData {
  total_vendors: number;
  total_buyers: number;
  total_apis: number;
  active_apis: number;
  total_api_calls: number;
  calls_last_24h: number;
  total_platform_revenue: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: dashboardData } = await api.getAdminDashboard();
      if (dashboardData) {
        setData(dashboardData as DashboardData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Platform Overview</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
                <div className="text-gray-400 text-sm mb-2">Total Vendors</div>
                <div className="text-3xl font-bold text-indigo-400">{data.total_vendors}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Total Buyers</div>
                <div className="text-3xl font-bold text-green-400">{data.total_buyers}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Total APIs</div>
                <div className="text-3xl font-bold">{data.total_apis}</div>
                <div className="text-sm text-gray-500 mt-1">{data.active_apis} active</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Platform Revenue</div>
                <div className="text-3xl font-bold gradient-text">${data.total_platform_revenue.toFixed(2)}</div>
              </div>
            </div>

            {/* Traffic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="glass-card p-6">
                <div className="text-gray-400 text-sm mb-2">Total API Calls</div>
                <div className="text-4xl font-bold">{data.total_api_calls.toLocaleString()}</div>
              </div>
              <div className="glass-card p-6">
                <div className="text-gray-400 text-sm mb-2">Calls (Last 24h)</div>
                <div className="text-4xl font-bold text-yellow-400">{data.calls_last_24h.toLocaleString()}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Administration</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/admin/vendors" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl">🏪</div>
                  <div>
                    <div className="font-semibold">Manage Vendors</div>
                    <div className="text-sm text-gray-400">View and moderate vendors</div>
                  </div>
                </a>
                <a href="/admin/buyers" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl">👥</div>
                  <div>
                    <div className="font-semibold">Manage Buyers</div>
                    <div className="text-sm text-gray-400">View and moderate buyers</div>
                  </div>
                </a>
                <a href="/admin/traffic" className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl">📈</div>
                  <div>
                    <div className="font-semibold">Traffic Monitor</div>
                    <div className="text-sm text-gray-400">Real-time platform traffic</div>
                  </div>
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">Failed to load dashboard data</div>
        )}
      </div>
    </DashboardLayout>
  );
}
