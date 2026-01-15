'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

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
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/marketplace" className="text-gray-400 hover:text-white transition">Marketplace</Link>
          <Link href="#features" className="text-gray-400 hover:text-white transition">Features</Link>
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

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-indigo-400 text-sm font-medium">🚀 The Future of AI APIs is Here</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Discover & Integrate
            <br />
            <span className="gradient-text">Powerful AI APIs</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            The premier marketplace connecting AI developers with businesses. 
            Publish your AI models or integrate cutting-edge APIs in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup?role=buyer" 
              className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg glow"
            >
              Start Integrating APIs
            </Link>
            <Link 
              href="/signup?role=vendor"
              className="px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-white font-semibold text-lg transition"
            >
              Publish Your API
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">500+</div>
              <div className="text-gray-400 mt-1">AI APIs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">10M+</div>
              <div className="text-gray-400 mt-1">API Calls/Month</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">5,000+</div>
              <div className="text-gray-400 mt-1">Developers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Everything You Need to <span className="gradient-text">Scale AI</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Integration</h3>
              <p className="text-gray-400">Get API keys and start calling AI models in under 60 seconds. No complex setup required.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-gray-400">Bank-grade encryption, API key management, and complete audit logs for compliance.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Analytics</h3>
              <p className="text-gray-400">Monitor usage, costs, and performance with beautiful dashboards and alerts.</p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Pay As You Go</h3>
              <p className="text-gray-400">Only pay for what you use. No minimum commitments, transparent pricing.</p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Developer-First</h3>
              <p className="text-gray-400">Comprehensive SDKs, OpenAPI specs, and interactive documentation.</p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card p-8 stat-card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Monetize Your AI</h3>
              <p className="text-gray-400">Turn your AI models into revenue. We handle billing, so you focus on innovation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-card p-12 text-center glow">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of developers already using AIExchange
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="gradient-btn px-8 py-4 rounded-xl text-white font-semibold text-lg"
            >
              Create Free Account
            </Link>
            <Link 
              href="/marketplace"
              className="px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-white font-semibold text-lg transition"
            >
              Browse APIs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
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
