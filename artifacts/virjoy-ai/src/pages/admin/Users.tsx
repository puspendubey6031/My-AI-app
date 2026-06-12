import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Define the User type based on your Supabase table
type User = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  is_blocked: boolean;
  created_at: string;
};

const planColors: { [key: string]: string } = {
  free: 'bg-gray-200 text-gray-800',
  starter: 'bg-blue-200 text-blue-800',
  creator: 'bg-purple-200 text-purple-800',
  premium: 'bg-yellow-200 text-yellow-800',
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null); // For block/unblock loading

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(search, 500);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async (currentPage: number, isLoadMore = false) => {
    if (!isLoadMore) {
        setUsers([]);
        setLoading(true);
    }
    try {
      let query = supabase
        .from('users')
        .select('id, name, email, plan, is_blocked, created_at')
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      if (planFilter !== 'All') {
        query = query.eq('plan', planFilter.toLowerCase());
      }
      
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setUsers(prev => isLoadMore ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

    } catch (error: any) {
      toast.error(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, planFilter]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchUsers(0, false);
  }, [debouncedSearch, planFilter, fetchUsers]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, true);
  };

  const toggleBlock = async (id: string, currentStatus: boolean) => {
    setIsToggling(id);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_blocked: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      setUsers(prevUsers => prevUsers.map(u => u.id === id ? { ...u, is_blocked: data.is_blocked } : u));
      toast.success(`User successfully ${!currentStatus ? 'blocked' : 'unblocked'}.`);

    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
        setIsToggling(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
        <input 
            type="text" 
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-1/3"
        />
        <select 
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="border p-2 rounded shadow-sm w-full md:w-auto"
        >
          <option value="All">All Plans</option>
          <option value="Free">Free</option>
          <option value="Starter">Starter</option>
          <option value="Creator">Creator</option>
          <option value="Premium">Premium</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && users.length === 0 ? (
                [...Array(10)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div></td></tr>
                ))
            ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found for the selected filters.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${planColors[user.plan?.toLowerCase() || 'free']}`}>
                        {user.plan || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_blocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold mr-4">View</Link>
                    <button 
                        onClick={() => toggleBlock(user.id, user.is_blocked)}
                        disabled={isToggling === user.id}
                        className={`font-semibold ${user.is_blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} disabled:opacity-50 disabled:cursor-wait`}
                    >
                        {isToggling === user.id ? 'Updating...' : (user.is_blocked ? 'Unblock' : 'Block')}
                    </button>
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

export default Users;