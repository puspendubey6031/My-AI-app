import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Define the type for a banner
type Banner = {
  id: string;
  title: string;
  image_url: string;
  redirect_url: string;
  target_users: 'all' | 'free' | 'premium';
  is_active: boolean;
  views: number;
  clicks: number;
  created_at: string;
};

const BannerAds: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state for creating/editing
  const [formState, setFormState] = useState({
    title: '',
    image_url: '',
    redirect_url: '',
    target_users: 'all' as 'all' | 'free' | 'premium',
    is_active: true,
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banner_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setBanners(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openModalForCreate = () => {
    setEditingBanner(null);
    setFormState({
      title: '',
      image_url: '',
      redirect_url: '',
      target_users: 'all',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormState({
      title: banner.title,
      image_url: banner.image_url,
      redirect_url: banner.redirect_url,
      target_users: banner.target_users,
      is_active: banner.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = editingBanner
      ? await supabase.from('banner_ads').update(formState).eq('id', editingBanner.id).select()
      : await supabase.from('banner_ads').insert(formState).select();

    if (error) {
      setError(error.message);
    } else {
      await fetchBanners();
      setIsModalOpen(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      const { error } = await supabase.from('banner_ads').delete().eq('id', id);
      if (error) {
        setError(error.message);
      } else {
        await fetchBanners();
      }
    }
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('banner_ads')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    if (error) {
        setError(error.message);
    } else {
        await fetchBanners();
    }
  }

  if (loading && banners.length === 0) {
    return <div className="flex justify-center items-center h-full">Loading banners...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner Ads Management</h1>
        <button onClick={openModalForCreate} className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition-colors">
          Add New Banner
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Title</label>
                <input type="text" name="title" id="title" value={formState.title} onChange={handleFormChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image_url">Image URL</label>
                <input type="text" name="image_url" id="image_url" value={formState.image_url} onChange={handleFormChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="redirect_url">Redirect URL</label>
                <input type="text" name="redirect_url" id="redirect_url" value={formState.redirect_url} onChange={handleFormChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target_users">Target Users</label>
                <select name="target_users" id="target_users" value={formState.target_users} onChange={handleFormChange} className="shadow border rounded w-full py-2 px-3 text-gray-700">
                  <option value="all">All Users</option>
                  <option value="free">Free Users</option>
                  <option value="premium">Premium Users</option>
                </select>
              </div>
               <div className="mb-4 flex items-center">
                 <input type="checkbox" name="is_active" id="is_active" checked={formState.is_active} onChange={handleFormChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                 <label className="ml-2 block text-sm text-gray-900" htmlFor="is_active">Active</label>
               </div>
              <div className="flex items-center justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2 hover:bg-gray-400">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                  {loading ? 'Saving...' : (editingBanner ? 'Save Changes' : 'Create Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats (Views/Clicks)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {banners.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No banners created yet.</td></tr>
            ) : (
              banners.map(banner => (
                <tr key={banner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                    <a href={banner.redirect_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">{banner.redirect_url}</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={banner.image_url} alt={banner.title} className="w-24 h-12 object-cover rounded border"/>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{banner.target_users}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{banner.views} / {banner.clicks}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label htmlFor={`toggle-${banner.id}`} className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id={`toggle-${banner.id}`} className="sr-only" checked={banner.is_active} onChange={() => toggleActive(banner)} />
                            <div className={`block w-10 h-6 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${banner.is_active ? 'transform translate-x-full' : ''}`}></div>
                        </div>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModalForEdit(banner)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Edit</button>
                    <button onClick={() => handleDelete(banner.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BannerAds;
