import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Define the User type
type User = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  credits: number;
  is_blocked: boolean;
  created_at: string;
};

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', plan: 'free', credits: 0, is_blocked: false });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found.');

      setUser(data);
      setFormData({
        name: data.name || '',
        plan: data.plan || 'free',
        credits: data.credits || 0,
        is_blocked: data.is_blocked,
      });

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleUpdate = async () => {
    if (!userId) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
            name: formData.name,
            plan: formData.plan,
            credits: Number(formData.credits),
            is_blocked: formData.is_blocked,
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User updated successfully!');
      await fetchUser(); // Refresh data
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            toast.success('User deleted successfully.');
            navigate('/admin/users');
        } catch (err: any) {
            toast.error(`Deletion failed: ${err.message}`);
            setIsDeleting(false);
        }
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div></div>;
  }

  if (error || !user) {
    return (
        <div className="p-6 text-center">
            <p className="text-red-500 mb-4">{error || 'User could not be loaded.'}</p>
            <Link to="/admin/users" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                &larr; Back to Users
            </Link>
        </div>
    )
  }

  return (
    <div>
        <div className="mb-4">
             <Link to="/admin/users" className="text-blue-500 hover:underline">
                &larr; Back to All Users
            </Link>
        </div>
      <h1 className="text-2xl font-bold mb-1">{user.name || 'User Detail'}</h1>
      <p className="text-sm text-gray-500 mb-6">User ID: {user.id}</p>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={user.email || ''} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" />
            </div>

            {/* Plan */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                <select name="plan" value={formData.plan} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="creator">Creator</option>
                    <option value="premium">Premium</option>
                </select>
            </div>

            {/* Credits */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Credits</label>
                <input type="number" name="credits" value={formData.credits} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>

            {/* Block Status */}
            <div className="md:col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <label className="font-medium text-gray-700">Block User</label>
                <label htmlFor="is_blocked" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" id="is_blocked" name="is_blocked" className="sr-only" checked={formData.is_blocked} onChange={handleToggleChange} />
                        <div className={`block w-12 h-7 rounded-full ${formData.is_blocked ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.is_blocked ? 'transform translate-x-full' : ''}`}></div>
                    </div>
                </label>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <button onClick={handleDelete} disabled={isDeleting} className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
            <button onClick={handleUpdate} disabled={isUpdating} className="bg-blue-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-400">
                {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
