'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in (must be in useEffect, not during render)
  useEffect(() => {
    if (user) {
      router.push(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // If user is logged in, show nothing while redirecting
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { success, error } = await login(email, password);
    
    if (success) {
      // RefreshUser will update the user context, then redirect
      window.location.href = '/';
    } else {
      setError(error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <span className="text-2xl font-bold">AIExchange</span>
        </Link>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn py-3 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-400">Don&apos;t have an account?</span>{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign up
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500 text-center mb-3">Demo Credentials</p>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p><strong>Admin:</strong> admin@aiexchange.com / Admin@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
