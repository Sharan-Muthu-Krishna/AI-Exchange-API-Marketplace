'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface TrafficData {
  period_hours: number;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  avg_response_time_ms: number;
  top_apis: { name: string; calls: number }[];
}

export default function AdminTrafficPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: trafficData } = await api.getTraffic(hours);
      if (trafficData) {
        setData(trafficData as TrafficData);
      }
      setLoading(false);
    };
    fetchData();
  }, [hours]);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Traffic Monitor</h1>
          <div className="flex gap-2">
            {[24, 48, 72, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  hours === h
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

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
                <div className="text-gray-400 text-sm mb-2">Total Calls</div>
                <div className="text-3xl font-bold">{data.total_calls.toLocaleString()}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Success Rate</div>
                <div className="text-3xl font-bold text-green-400">{data.success_rate.toFixed(1)}%</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Failed Calls</div>
                <div className="text-3xl font-bold text-red-400">{data.failed_calls.toLocaleString()}</div>
              </div>
              <div className="glass-card p-6 stat-card">
                <div className="text-gray-400 text-sm mb-2">Avg Response Time</div>
                <div className="text-3xl font-bold text-yellow-400">{data.avg_response_time_ms}ms</div>
              </div>
            </div>

            {/* Top APIs */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Top APIs</h2>
              {data.top_apis.length === 0 ? (
                <p className="text-gray-400">No API calls in this period</p>
              ) : (
                <div className="space-y-4">
                  {data.top_apis.map((api, index) => (
                    <div key={api.name} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-400">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{api.name}</div>
                        <div className="h-2 bg-gray-800 rounded-full mt-2">
                          <div 
                            className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${(api.calls / data.top_apis[0].calls) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-gray-400">{api.calls.toLocaleString()} calls</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">Failed to load traffic data</div>
        )}
      </div>
    </DashboardLayout>
  );
}
