import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Define types
type Payment = {
  id: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  payment_id: string; // Assuming this is the transaction/charge ID
  plan_name: string;
  created_at: string;
  users: {
    name: string | null;
    email: string | null;
  } | null;
};

const statusColors: { [key in Payment['status']]: string } = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const SkeletonRow = () => (
    <tr><td colSpan={7} className="p-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div></td></tr>
);

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters and Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const debouncedSearch = useDebounce(search, 500);
  const PAGE_SIZE = 25;

  const fetchPayments = useCallback(async (currentPage: number, isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
    }
    try {
      let query = supabase
        .from('payments')
        .select(`id, amount, status, payment_id, plan_name, created_at, users (name, email)`)
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.or(`users.email.ilike.%${debouncedSearch}%,payment_id.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter.toLowerCase());
      }
      if (dateRange.from) {
        query = query.gte('created_at', new Date(dateRange.from).toISOString());
      }
       if (dateRange.to) {
        // Add 1 day to the 'to' date to include the whole day
        const toDate = new Date(dateRange.to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lte('created_at', toDate.toISOString());
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setPayments(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

    } catch (error: any) {
      toast.error(`Failed to fetch payments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dateRange]);

  useEffect(() => {
    setPage(0);
    setPayments([]);
    setHasMore(true);
    fetchPayments(0, false);
  }, [debouncedSearch, statusFilter, dateRange, fetchPayments]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayments(nextPage, true);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>
      
      {/* Filter and Search Controls */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4 items-center">
        <input 
            type="text" 
            placeholder="Search by email or payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded shadow-sm flex-grow min-w-[250px]"
        />
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded shadow-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
        <div className="flex items-center gap-2">
            <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({...p, from: e.target.value}))} className="border p-2 rounded shadow-sm" />
            <span>to</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({...p, to: e.target.value}))} className="border p-2 rounded shadow-sm" />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && payments.length === 0 ? (
                [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
            ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No payments match the current filters.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{p.users?.name || '-'}</div>
                    <div className="text-sm text-gray-500">{p.users?.email || 'Unknown User'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{p.plan_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-lg">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColors[p.status]}`}>
                        {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{p.payment_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.created_at).toLocaleString()}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">-</td>
                </tr>
              ))
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

export default Payments;
