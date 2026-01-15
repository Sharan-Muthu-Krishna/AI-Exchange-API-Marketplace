'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function SignupForm() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role')?.toUpperCase() as 'VENDOR' | 'BUYER' | null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'VENDOR' | 'BUYER'>(defaultRole || 'BUYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { success, error } = await register(
      email, 
      password, 
      role, 
      role === 'VENDOR' ? companyName : undefined
    );
    
    if (success) {
      router.push(`/${role.toLowerCase()}`);
    } else {
      setError(error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center">
          <span className="text-white font-bold text-xl">AI</span>
        </div>
        <span className="text-2xl font-bold">AIExchange</span>
      </Link>

      {/* Signup Card */}
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-gray-400 text-center mb-8">Get started with AIExchange</p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole('BUYER')}
            className={`p-4 rounded-xl border-2 transition-all ${
              role === 'BUYER'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">🛒</div>
            <div className="font-semibold">API Consumer</div>
            <div className="text-xs text-gray-400 mt-1">Use AI APIs</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('VENDOR')}
            className={`p-4 rounded-xl border-2 transition-all ${
              role === 'VENDOR'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-semibold">API Provider</div>
            <div className="text-xs text-gray-400 mt-1">Publish APIs</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {role === 'VENDOR' && (
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Already have an account?</span>{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center">
          <span className="text-white font-bold text-xl">AI</span>
        </div>
        <span className="text-2xl font-bold">AIExchange</span>
      </div>
      <div className="glass-card p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4 py-12">
      <Suspense fallback={<LoadingFallback />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
