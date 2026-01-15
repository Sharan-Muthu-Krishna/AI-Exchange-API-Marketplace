'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_call: number;
  is_active: boolean;
  gateway_url: string;
  total_calls: number;
}

export default function VendorApisPage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApis = async () => {
      const { data } = await api.getVendorApis();
      if (data) {
        setApis(data as ApiItem[]);
      }
      setLoading(false);
    };
    fetchApis();
  }, []);

  const handleToggleStatus = async (apiId: string, currentStatus: boolean) => {
    const { error } = await api.updateApi(apiId, { is_active: !currentStatus });
    if (!error) {
      setApis(apis.map(a => 
        a.id === apiId ? { ...a, is_active: !currentStatus } : a
      ));
    }
  };

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My APIs</h1>
          <a href="/vendor/create" className="gradient-btn px-6 py-3 rounded-xl text-white font-medium">
            + Create API
          </a>
        </div>

        {loading ? (
          <div className="glass-card p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : apis.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No APIs yet</h2>
            <p className="text-gray-400 mb-6">Create your first API to start earning</p>
            <a href="/vendor/create" className="gradient-btn px-6 py-3 rounded-xl inline-block text-white font-medium">
              Create API
            </a>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Calls</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apis.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{item.category || 'General'}</span>
                    </td>
                    <td>
                      <span className="font-mono">{item.price_per_call} credits</span>
                    </td>
                    <td>{item.total_calls?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item.id, item.is_active)}
                          className="px-3 py-1.5 rounded-lg text-sm border border-gray-700 hover:border-gray-500 transition"
                        >
                          {item.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <a
                          href={`/vendor/apis/${item.id}`}
                          className="px-3 py-1.5 rounded-lg text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition"
                        >
                          Manage
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
