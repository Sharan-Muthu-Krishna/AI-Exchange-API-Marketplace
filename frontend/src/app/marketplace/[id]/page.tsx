'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ApiDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_call: number;
  vendor_name: string;
  is_active: boolean;
  created_at: string;
  input_schema: string;
  output_schema: string;
  total_calls: number;
  gateway_url: string;
}

export default function ApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.id as string;
  const { user, logout } = useAuth();
  
  const [apiData, setApiData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/signup?role=buyer');
      return;
    }
    setSubscribing(true);
    setMessage(null);
    const { error } = await api.subscribe(apiId);
    if (error) {
      setMessage({ type: 'error', text: typeof error === 'string' ? error : 'Failed to subscribe' });
    } else {
      setMessage({ type: 'success', text: 'Successfully subscribed! Go to your dashboard to get your API key.' });
    }
    setSubscribing(false);
  };

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const { data, error: fetchError } = await api.getApiDetails(apiId);
        if (data && !fetchError) {
          setApiData(data as ApiDetail);
        } else {
          setError('API not found');
        }
      } catch (err) {
        setError('Failed to load API details');
      }
      setLoading(false);
    };
    
    if (apiId) fetchApi();
  }, [apiId]);

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !apiData) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">API Not Found</h1>
          <p className="text-gray-400 mb-6">The API you're looking for doesn't exist or is inactive.</p>
          <Link href="/marketplace" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <span className="text-xl font-bold">AIExchange</span>
        </Link>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          {user ? (
            <>
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
            <Link href="/signup?role=buyer" className="gradient-btn px-5 py-2 rounded-xl text-white font-medium text-sm">
              Sign Up to Subscribe
            </Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="glass-card p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="badge badge-info text-sm mb-3">{apiData.category || 'General'}</span>
                <h1 className="text-4xl font-bold mb-2">{apiData.name}</h1>
                <p className="text-gray-400">by {apiData.vendor_name || 'Unknown Vendor'}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold gradient-text">{apiData.price_per_call}</div>
                <div className="text-gray-500">credits per call</div>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg mb-8">
              {apiData.description || 'No description provided.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{apiData.total_calls || 0}</div>
                <div className="text-gray-500 text-sm">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{apiData.is_active ? 'Active' : 'Inactive'}</div>
                <div className="text-gray-500 text-sm">Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {new Date(apiData.created_at).toLocaleDateString()}
                </div>
                <div className="text-gray-500 text-sm">Published</div>
              </div>
            </div>
          </div>

          {/* Gateway URL */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Gateway Endpoint</h2>
            <p className="text-gray-400 text-sm mb-4">
              After subscribing, use this endpoint to call the API:
            </p>
            <code className="block bg-gray-900 p-4 rounded-lg font-mono text-indigo-400 text-sm">
              POST http://localhost:8000/v1/apis/{apiData.id}/run
            </code>
          </div>

          {/* Input Schema */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Input Schema</h2>
            <p className="text-gray-400 text-sm mb-4">
              The request body format expected by this API:
            </p>
            {apiData.input_schema ? (
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">{apiData.input_schema}</code>
              </pre>
            ) : (
              <p className="text-gray-500 italic">No input schema specified</p>
            )}
          </div>

          {/* Output Schema */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Output Schema</h2>
            <p className="text-gray-400 text-sm mb-4">
              The response format returned by this API:
            </p>
            {apiData.output_schema ? (
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-blue-400">{apiData.output_schema}</code>
              </pre>
            ) : (
              <p className="text-gray-500 italic">No output schema specified</p>
            )}
          </div>

          {/* Usage Example */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-gray-300">{`curl -X POST "http://localhost:8000/v1/apis/${apiData.id}/run" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${apiData.input_schema || '{"your": "data"}'}'`}</code>
            </pre>
          </div>

          {/* CTA */}
          <div className="glass-card p-8 text-center">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}
            
            {user ? (
              <>
                <h3 className="text-2xl font-bold mb-2">Subscribe to this API</h3>
                <p className="text-gray-400 mb-6">Add this API to your subscriptions and start using it</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="gradient-btn px-8 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                  >
                    {subscribing ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
                  <Link 
                    href={`/${user.role.toLowerCase()}`}
                    className="px-8 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-white transition"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">Ready to use this API?</h3>
                <p className="text-gray-400 mb-6">Create an account to subscribe and get your API key</p>
                <div className="flex gap-4 justify-center">
                  <Link 
                    href="/signup?role=buyer"
                    className="gradient-btn px-8 py-3 rounded-xl text-white font-medium"
                  >
                    Sign Up Now
                  </Link>
                  <Link 
                    href="/login"
                    className="px-8 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-white transition"
                  >
                    Login
                  </Link>
                </div>
              </>
            )}
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
