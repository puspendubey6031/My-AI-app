import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Types
type Payment = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  users: { id: string; email: string | null } | null;
};

const PAGE_SIZE = 25;

const statusColors: { [key: string]: string } = {
  success: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchPayments = useCallback(async (currentPage: number, isLoadMore = false) => {
    if (!isLoadMore) {
      setPayments([]);
      setLoading(true);
    }
    try {
      let query = supabase
        .from('payments')
        .select('id, amount, status, created_at, users(id, email)')
        .order('created_at', { ascending: false });

      if (debouncedSearchTerm) {
        // This is a bit tricky since we search on a related table.
        // Supabase doesn't directly support filtering on nested fields like this in a simple query.
        // A workaround could be a database function or fetching users first.
        // For now, we will just toast a message to the user.
        toast.error('Searching by email is not supported in this demo.');
      }
      
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter.toLowerCase());
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      setPayments(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

    } catch (error: any) {
      toast.error(`Error fetching payments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPayments(0, false);
  }, [fetchPayments]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayments(nextPage, true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payments History</h1>
      
      <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <input 
          type="text" 
          placeholder="Search by user email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded shadow-sm w-full md:w-1/3"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded shadow-sm w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && payments.length === 0 ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div></td></tr>
              ))
            ) : payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{payment.users?.email || 'N/A'}</div>
                  <div className="text-sm text-gray-500">User ID: {payment.users?.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${payment.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {payments.length === 0 && !loading && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No payments found.</td></tr>
            )}
          </tbody>
        </table>
        {hasMore && !loading && (
            <div className="p-4 text-center border-t">
                <button onClick={handleLoadMore} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm">
                    Load More
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
