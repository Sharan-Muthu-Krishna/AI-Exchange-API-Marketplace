'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface LogItem {
  id: string;
  api_id: string;
  api_name: string;
  buyer_id: string;
  credits_used: number;
  status: string;
  response_time_ms: number;
  error_message: string | null;
  timestamp: string;
}

export default function VendorLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await api.getVendorLogs({ page });
      if (data) {
        setLogs(data as LogItem[]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'TIMEOUT': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Usage Logs</h1>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No API calls recorded yet</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr className="bg-gray-900/50">
                    <th>Timestamp</th>
                    <th>API</th>
                    <th>Status</th>
                    <th>Credits</th>
                    <th>Response Time</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-gray-400 text-sm whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="font-medium">{log.api_name}</td>
                      <td>
                        <span className={`badge ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="font-mono">{log.credits_used.toFixed(2)}</td>
                      <td className="text-gray-400">
                        {log.response_time_ms?.toFixed(0) || 0}ms
                      </td>
                      <td className="text-sm text-red-400 max-w-xs truncate">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-400">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={logs.length < 20}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
