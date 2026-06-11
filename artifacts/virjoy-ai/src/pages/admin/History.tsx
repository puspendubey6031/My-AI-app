
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// A simple debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const History = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const debouncedSearch = useDebounce(search, 500);

  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (currentPage: number, loadMore: boolean) => {
    if (!loadMore) {
        setLoading(true);
    } else {
        setIsFetchingMore(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('video_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.ilike('video_title', `%${debouncedSearch}%`);
      }
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setHistory(prev => loadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

    } catch (err: any) {
      setError(`Failed to fetch history: ${err.message}`);
      toast.error(`Failed to fetch history: ${err.message}`);
    } finally {
        setLoading(false);
        setIsFetchingMore(false);
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Video Generation History</h1>
      
      <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
        <input 
            type="text" 
            placeholder="Search by video title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-1/3"
        />
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.video_title || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-normal max-w-xs truncate">{item.prompt}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.duration}s</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.credits_used}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                        }`}>
                            {item.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="text-center mt-4">
              <button 
                onClick={handleLoadMore} 
                disabled={isFetchingMore}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isFetchingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
