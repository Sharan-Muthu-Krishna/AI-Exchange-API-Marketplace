'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

export default function CreateApiPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    real_endpoint: '',
    price_per_call: 1,
    input_schema: '',
    output_schema: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price_per_call' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: apiError } = await api.createApi(formData);
    
    if (apiError) {
      setError(typeof apiError === 'string' ? apiError : 'Failed to create API');
      setLoading(false);
    } else {
      router.push('/vendor/apis');
    }
  };

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New API</h1>

        <form onSubmit={handleSubmit} className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">API Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Image Classification API"
                  required
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
                  <option value="">Select a category</option>
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
                placeholder="Describe what your API does, its features, and use cases..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Technical Details */}
            <div className="pt-6 border-t border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Technical Configuration</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Real Endpoint URL *</label>
                  <input
                    type="url"
                    name="real_endpoint"
                    value={formData.real_endpoint}
                    onChange={handleChange}
                    placeholder="https://your-model-server.com/api/predict"
                    required
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">This URL is private and never exposed to buyers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Per Call (Credits) *</label>
                  <input
                    type="number"
                    name="price_per_call"
                    value={formData.price_per_call}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Input Schema (JSON)</label>
                  <textarea
                    name="input_schema"
                    value={formData.input_schema}
                    onChange={handleChange}
                    placeholder='{"image": "base64 encoded image", "options": {"threshold": 0.5}}'
                    rows={4}
                    className="w-full font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Output Schema (JSON)</label>
                  <textarea
                    name="output_schema"
                    value={formData.output_schema}
                    onChange={handleChange}
                    placeholder='{"predictions": [{"label": "string", "confidence": "number"}]}'
                    rows={4}
                    className="w-full font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn px-8 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create API'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
