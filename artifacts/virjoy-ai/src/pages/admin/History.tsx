import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

type HistoryEntry = {
  id: string;
  video_title: string | null;
  status: string;
  created_at: string;
  users: { id: string, name: string | null, email: string | null } | null;
};

const PAGE_SIZE = 20;

const AdminHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const debouncedSearch = useDebounce(search, 500);

  const fetchHistory = useCallback(async (currentPage: number, isLoadMore = false) => {
    if (!isLoadMore) {
        setHistory([]);
        setLoading(true);
    }
    try {
      let query = supabase
        .from('video_history')
        .select('id, video_title, status, created_at, users(id, name, email)')
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.ilike('video_title', `%${debouncedSearch}%`);
      }
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter.toLowerCase());
      }
      
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      setHistory(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

    } catch (error: any) {
      toast.error(`Failed to fetch history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchHistory(0, false);
  }, [debouncedSearch, statusFilter, fetchHistory]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this history entry?')) {
        try {
            const { error } = await supabase.from('video_history').delete().eq('id', id);
            if (error) throw error;
            toast.success('History entry deleted.');
            setHistory(currentHistory => currentHistory.filter(item => item.id !== id));
        } catch (error: any) {
            toast.error(`Delete failed: ${error.message}`);
        }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Video Generation History</h1>
      
      <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
        <input 
            type="text" 
            placeholder="Search by video title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-1/2"
        />
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font--medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && history.length === 0 ? (
                [...Array(10)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div></td></tr>
                ))
            ) : history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No history found.</td></tr>
            ) : (
              history.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.users ? (
                         <Link to={`/admin/users/${item.users.id}`}>
                            <a className="font-medium text-indigo-600 hover:text-indigo-900">{item.users.name || 'N/A'}</a>
                        </Link>
                    ) : (
                        <span className="text-gray-500">N/A</span>
                    )}
                     <div className="text-sm text-gray-500">{item.users?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.video_title || 'Untitled'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize`}>
                        {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                  </td>
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

export default AdminHistoryPage;
