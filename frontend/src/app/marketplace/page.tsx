'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_call: number;
  vendor_name: string;
}

export default function PublicMarketplacePage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      const [apisRes, catsRes] = await Promise.all([
        api.getMarketplaceApis({ search, category: category || undefined }),
        api.getCategories()
      ]);
      
      if (apisRes.data) {
        // API returns { items: [...], total, page, ... }
        const response = apisRes.data as { items: ApiItem[] };
        setApis(response.items || []);
      }
      if (catsRes.data) {
        // Categories returns [{ name: "...", count: X }, ...]
        const cats = catsRes.data as { name: string; count: number }[];
        setCategories(cats.map(c => c.name));
      }
      setLoading(false);
    };
    fetchData();
  }, [search, category]);

  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-bold">AIExchange</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/marketplace" className="text-white font-medium">Marketplace</Link>
          <Link href="/#features" className="text-gray-400 hover:text-white transition">Features</Link>
        </div>

        <div className="flex items-center justify-end gap-3">
          {user ? (
            <>
              <span className="text-gray-400 text-sm hidden md:block">{user.email}</span>
              <Link 
                href={`/${user.role.toLowerCase()}`}
                className="gradient-btn px-5 py-2 rounded-xl text-white font-medium text-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition font-medium text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white transition">
                Sign In
              </Link>
              <Link href="/signup" className="gradient-btn px-5 py-2 rounded-xl text-white font-medium text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore <span className="gradient-text">AI APIs</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover powerful AI APIs from top vendors. Sign up to start integrating.
            </p>
          </div>

          {/* Filters */}
          <div className="glass-card p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search APIs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="md:w-48"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* API Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading APIs...</div>
          ) : apis.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No APIs found</div>
              <Link href="/signup?role=vendor" className="text-indigo-400 hover:text-indigo-300">
                Be the first to publish an API →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apis.map((item) => (
                <div key={item.id} className="glass-card p-6 stat-card flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link href={`/marketplace/${item.id}`} className="hover:text-indigo-400 transition">
                        <h3 className="text-xl font-semibold mb-1">{item.name}</h3>
                      </Link>
                      <span className="badge badge-info text-xs">{item.category || 'General'}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">{item.price_per_call}</div>
                      <div className="text-xs text-gray-500">credits/call</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                    {item.description || 'No description available'}
                  </p>

                  <div className="text-sm text-gray-500 mb-4">
                    by {item.vendor_name || 'Unknown Vendor'}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/marketplace/${item.id}`}
                      className="flex-1 text-center py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition font-medium"
                    >
                      View Details
                    </Link>
                    <Link
                      href="/signup?role=buyer"
                      className="flex-1 text-center py-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition font-medium"
                    >
                      Subscribe
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="glass-card p-8 inline-block">
              <h3 className="text-2xl font-bold mb-2">Ready to integrate AI?</h3>
              <p className="text-gray-400 mb-6">Create a free account to access all APIs</p>
              <div className="flex gap-4 justify-center">
                <Link href="/signup?role=buyer" className="gradient-btn px-6 py-3 rounded-xl text-white font-medium">
                  Start as Buyer
                </Link>
                <Link href="/signup?role=vendor" className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-white transition">
                  Become a Vendor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold">AIExchange</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2026 AIExchange. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
