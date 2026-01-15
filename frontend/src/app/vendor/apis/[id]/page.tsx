'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface ApiData {
  id: string;
  name: string;
  description: string;
  category: string;
  real_endpoint: string;
  input_schema: string;
  output_schema: string;
  price_per_call: number;
  is_active: boolean;
  gateway_url: string;
  total_calls: number;
}

interface Analytics {
  api_id: string;
  api_name: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  total_earnings: number;
  avg_response_time_ms: number;
}

export default function VendorApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.id as string;
  
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price_per_call: 1,
    is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [apiRes, analyticsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/vendor/apis/${apiId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        }),
        api.getVendorAnalytics(apiId)
      ]);
      
      if (apiRes.ok) {
        const data = await apiRes.json();
        setApiData(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          category: data.category || '',
          price_per_call: data.price_per_call,
          is_active: data.is_active,
        });
      }
      
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data as Analytics);
      }
      
      setLoading(false);
    };
    
    if (apiId) fetchData();
  }, [apiId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await api.updateApi(apiId, formData);
    if (!error) {
      router.push('/vendor/apis');
    }
    setSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <DashboardLayout role="vendor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!apiData) {
    return (
      <DashboardLayout role="vendor">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">API Not Found</h2>
          <a href="/vendor/apis" className="text-indigo-400">← Back to APIs</a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/vendor/apis" className="text-gray-400 text-sm hover:text-white mb-2 inline-block">
              ← Back to APIs
            </a>
            <h1 className="text-3xl font-bold">{apiData.name}</h1>
          </div>
          <span className={`badge ${apiData.is_active ? 'badge-success' : 'badge-danger'}`}>
            {apiData.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <div className="text-gray-400 text-sm">Total Calls</div>
              <div className="text-2xl font-bold">{analytics.total_calls.toLocaleString()}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-gray-400 text-sm">Success Rate</div>
              <div className="text-2xl font-bold text-green-400">{analytics.success_rate.toFixed(1)}%</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-gray-400 text-sm">Earnings</div>
              <div className="text-2xl font-bold gradient-text">${analytics.total_earnings.toFixed(2)}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-gray-400 text-sm">Avg Response</div>
              <div className="text-2xl font-bold text-yellow-400">{analytics.avg_response_time_ms}ms</div>
            </div>
          </div>
        )}

        {/* Gateway URL */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Gateway URL</h2>
          <p className="text-gray-400 text-sm mb-4">
            Buyers will call this URL to use your API. Share the API ID, not your real endpoint.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900 p-4 rounded-lg text-sm font-mono text-indigo-400">
              POST http://localhost:8000/v1/apis/{apiData.id}/run
            </code>
            <button
              onClick={() => copyToClipboard(`http://localhost:8000/v1/apis/${apiData.id}/run`)}
              className="px-4 py-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
            >
              📋
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Edit API</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">API Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="">Select category</option>
                  <option value="Vision">Vision</option>
                  <option value="NLP">NLP</option>
                  <option value="Audio">Audio</option>
                  <option value="Generative">Generative</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Price per Call (Credits)</label>
                <input
                  type="number"
                  name="price_per_call"
                  value={formData.price_per_call}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`px-6 py-3 rounded-xl font-medium transition ${
                    formData.is_active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {formData.is_active ? '✓ Active' : '✗ Inactive'}
                </button>
              </div>
            </div>

            {/* Read-only: Real Endpoint */}
            <div className="pt-4 border-t border-gray-800">
              <label className="block text-sm font-medium mb-2">Real Endpoint (Read-only)</label>
              <code className="block bg-gray-900 p-3 rounded-lg text-sm text-gray-400">
                {apiData.real_endpoint}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={() => router.push('/vendor/apis')}
              className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-btn px-8 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
