import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Define the type for a plan
type Plan = {
  id: string;
  name: string;
  price: number;
  credits: number; // Added credits
  features: string; // Changed from json to string for textarea
  is_active: boolean;
  created_at: string;
};

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    price: 0,
    credits: 0,
    features: '',
    is_active: true,
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to fetch plans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openModalForCreate = () => {
    setEditingPlan(null);
    setFormState({ name: '', price: 0, credits: 0, features: '', is_active: true });
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormState({ ...plan, features: Array.isArray(plan.features) ? plan.features.join('\n') : String(plan.features) });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
f    setLoading(true);

    const payload = {
        ...formState,
        price: Number(formState.price),
        credits: Number(formState.credits),
    };

    const { error } = editingPlan
      ? await supabase.from('plans').update(payload).eq('id', editingPlan.id)
      : await supabase.from('plans').insert([payload]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Plan successfully ${editingPlan ? 'updated' : 'created'}!`);
      await fetchPlans();
      setIsModalOpen(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This could affect active subscriptions.')) {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Plan deleted.');
        await fetchPlans();
      }
    }
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase.from('plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Plan ${!plan.is_active ? 'activated' : 'deactivated'}.`);
      await fetchPlans();
    }
  }

  if (loading && plans.length === 0) {
    return <div className="flex justify-center items-center h-full">Loading plans...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <button onClick={openModalForCreate} className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600">
          Add New Plan
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-2" htmlFor="name">Plan Name</label>
                    <input type="text" name="name" value={formState.name} onChange={handleFormChange} className="shadow border rounded w-full py-2 px-3" required />
                </div>
                 <div>
                    <label className="block text-sm font-bold mb-2" htmlFor="price">Price ($)</label>
                    <input type="number" name="price" value={formState.price} onChange={handleFormChange} className="shadow border rounded w-full py-2 px-3" required />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2" htmlFor="credits">Credits</label>
                    <input type="number" name="credits" value={formState.credits} onChange={handleFormChange} className="shadow border rounded w-full py-2 px-3" required />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-bold mb-2" htmlFor="features">Features (one per line)</label>
                <textarea name="features" value={formState.features} onChange={handleFormChange} rows={4} className="shadow border rounded w-full py-2 px-3"/>
              </div>
              <div className="mt-4 flex items-center">
                 <input type="checkbox" name="is_active" id="is_active" checked={formState.is_active} onChange={handleFormChange} className="h-4 w-4 text-blue-600 rounded" />
                 <label className="ml-2 text-sm" htmlFor="is_active">Is Active</label>
              </div>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded mr-2">Cancel</button>
                <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price/Credits</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Features</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {error ? (
                <tr><td colSpan={5} className="text-center py-8 text-red-500">Error: {error}</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No plans found.</td></tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{plan.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-lg">${plan.price}</div>
                    <div className="text-sm text-gray-600">{plan.credits} credits</div>
                  </td>
                   <td className="px-6 py-4 text-sm text-gray-600">{(plan.features || '').split('\n').map((f,i) => f && <div key={i}>- {f}</div>)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={plan.is_active} onChange={() => toggleActive(plan)} />
                            <div className={`block w-10 h-6 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${plan.is_active ? 'transform translate-x-full' : ''}`}></div>
                        </div>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModalForEdit(plan)} className="text-indigo-600 hover:text-indigo-900 font-semibold mr-4">Edit</button>
                    <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
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

export default Plans;
