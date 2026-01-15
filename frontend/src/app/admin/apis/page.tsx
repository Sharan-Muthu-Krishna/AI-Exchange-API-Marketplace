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
  vendor_id: string;
  created_at: string;
}

export default function AdminApisPage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchApis = async () => {
      setLoading(true);
      const isActive = filter === 'all' ? undefined : filter === 'active';
      const { data } = await api.getAdminApis(isActive);
      if (data) {
        setApis(data as ApiItem[]);
      }
      setLoading(false);
    };
    fetchApis();
  }, [filter]);

  const handleToggleStatus = async (apiId: string, currentStatus: boolean) => {
    const { error } = await api.updateApiStatus(apiId, !currentStatus);
    if (!error) {
      setApis(apis.map(a => 
        a.id === apiId ? { ...a, is_active: !currentStatus } : a
      ));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">APIs</h1>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition ${
                  filter === f
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : apis.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No APIs found</div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
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
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(item.id, item.is_active)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          item.is_active
                            ? 'text-red-400 border border-red-500/30 hover:bg-red-500/10'
                            : 'text-green-400 border border-green-500/30 hover:bg-green-500/10'
                        }`}
                      >
                        {item.is_active ? 'Disable' : 'Enable'}
                      </button>
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
