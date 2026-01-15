'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'vendor' | 'buyer' | 'admin';
}

const navItems = {
  vendor: [
    { href: '/vendor', label: 'Overview', icon: '📊' },
    { href: '/vendor/apis', label: 'My APIs', icon: '🔌' },
    { href: '/vendor/create', label: 'Create API', icon: '➕' },
    { href: '/vendor/logs', label: 'Logs', icon: '📜' },
    { href: '/vendor/earnings', label: 'Earnings', icon: '💰' },
  ],
  buyer: [
    { href: '/buyer', label: 'Overview', icon: '📊' },
    { href: '/buyer/marketplace', label: 'Marketplace', icon: '🛒' },
    { href: '/buyer/subscriptions', label: 'Subscriptions', icon: '📦' },
    { href: '/buyer/keys', label: 'API Keys', icon: '🔑' },
    { href: '/buyer/credits', label: 'Credits', icon: '💳' },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/vendors', label: 'Vendors', icon: '🏪' },
    { href: '/admin/buyers', label: 'Buyers', icon: '👥' },
    { href: '/admin/apis', label: 'APIs', icon: '🔌' },
    { href: '/admin/traffic', label: 'Traffic', icon: '📈' },
    { href: '/admin/logs', label: 'Logs', icon: '📜' },
  ],
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role.toLowerCase() !== role) {
      router.push(`/${user.role.toLowerCase()}`);
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const items = navItems[role];

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 p-6 flex flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <span className="text-xl font-bold">AIExchange</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex-1 space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">
                {user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.email}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
