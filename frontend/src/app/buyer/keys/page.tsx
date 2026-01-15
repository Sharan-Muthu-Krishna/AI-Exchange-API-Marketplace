'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface ApiKeyItem {
  id: string;
  key_prefix: string;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface NewKey {
  id: string;
  key: string;
  key_prefix: string;
  name: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    const { data } = await api.getApiKeys();
    if (data) {
      setKeys(data as ApiKeyItem[]);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    
    const { data, error: apiError } = await api.createApiKey(keyName || undefined);
    
    if (apiError) {
      setError(typeof apiError === 'string' ? apiError : 'Failed to create key');
    } else if (data) {
      setNewKey(data as NewKey);
      setKeyName('');
      await fetchKeys();
    }
    setCreating(false);
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    const { error } = await api.revokeApiKey(keyId);
    if (!error) {
      setKeys(keys.map(k => k.id === keyId ? { ...k, is_active: false } : k));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Keys</h1>

        {/* Create Key Section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
          
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (optional)"
              className="flex-1"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="gradient-btn px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>

        {/* New Key Display */}
        {newKey && (
          <div className="glass-card p-6 mb-8 border border-green-500/30 bg-green-500/5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔑</div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-400 mb-2">API Key Created!</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 p-3 rounded-lg text-sm font-mono break-all">
                    {newKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKey.key)}
                    className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                  >
                    📋
                  </button>
                </div>
              </div>
              <button onClick={() => setNewKey(null)} className="text-gray-500 hover:text-white">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Existing Keys */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">Your API Keys</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No API keys yet. Create one to start using APIs.
            </div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Key</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td>
                      <code className="text-sm font-mono">{key.key_prefix}</code>
                    </td>
                    <td>{key.name || '-'}</td>
                    <td>
                      <span className={`badge ${key.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-sm">
                      {key.last_used_at 
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td>
                      {key.is_active && (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="px-3 py-1.5 rounded-lg text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
                        >
                          Revoke
                        </button>
                      )}
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
