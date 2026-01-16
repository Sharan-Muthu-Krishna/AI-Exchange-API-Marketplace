'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_call: number;
  vendor_name: string;
  total_calls: number;
  gateway_url: string;
}

interface Category {
  name: string;
  count: number;
}

export default function MarketplacePage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [apisRes, catsRes] = await Promise.all([
        api.getMarketplaceApis({ search, category: selectedCategory }),
        api.getCategories()
      ]);
      
      if (apisRes.data) {
        const result = apisRes.data as { items: ApiItem[] };
        setApis(result.items || []);
      }
      if (catsRes.data) {
        setCategories(catsRes.data as Category[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [search, selectedCategory]);

  const handleSubscribe = async (apiId: string) => {
    setSubscribing(apiId);
    setMessage(null);
    
    const { error } = await api.subscribe(apiId);
    
    if (error) {
      setMessage({ type: 'error', text: typeof error === 'string' ? error : 'Failed to subscribe' });
    } else {
      setMessage({ type: 'success', text: 'Successfully subscribed!' });
    }
    setSubscribing(null);
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Marketplace</h1>

        {/* Search and Filters */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search APIs..."
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  !selectedCategory
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : apis.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">No APIs found</h2>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apis.map((item) => (
              <div key={item.id} className="glass-card p-6 stat-card flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <a 
                      href={`/marketplace/${item.id}`}
                      className="text-lg font-semibold hover:text-indigo-400 transition"
                    >
                      {item.name}
                    </a>
                    <p className="text-sm text-gray-500">{item.vendor_name || 'Unknown Vendor'}</p>
                  </div>
                  <span className="badge badge-info">{item.category || 'General'}</span>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                  {item.description || 'No description available'}
                </p>

                {/* Gateway URL */}
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Gateway URL:</div>
                  <code className="text-xs text-indigo-400 break-all">
                    POST {API_BASE_URL}/v1/apis/{item.id}/run
                  </code>
                </div>

                <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-800">
                  <div>
                    <div className="text-2xl font-bold">{item.price_per_call}</div>
                    <div className="text-xs text-gray-500">credits/call</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{item.total_calls?.toLocaleString() || 0}</div>
                    <div className="text-xs text-gray-500">total calls</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/marketplace/${item.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition font-medium"
                  >
                    View Details
                  </a>
                  <button
                    onClick={() => handleSubscribe(item.id)}
                    disabled={subscribing === item.id}
                    className="flex-1 gradient-btn py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {subscribing === item.id ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
