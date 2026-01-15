'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface VendorItem {
  id: string;
  user_id: string;
  email: string;
  company_name: string | null;
  wallet_balance: number;
  created_at: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await api.getAdminVendors();
      if (data) {
        setVendors(data as VendorItem[]);
      }
      setLoading(false);
    };
    fetchVendors();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Vendors</h1>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No vendors registered yet</div>
          ) : (
            <table>
              <thead>
                <tr className="bg-gray-900/50">
                  <th>Email</th>
                  <th>Company</th>
                  <th>Wallet Balance</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="font-medium">{vendor.email}</td>
                    <td>{vendor.company_name || '-'}</td>
                    <td>
                      <span className="text-green-400">${Number(vendor.wallet_balance).toFixed(2)}</span>
                    </td>
                    <td className="text-gray-400">
                      {new Date(vendor.created_at).toLocaleDateString()}
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
