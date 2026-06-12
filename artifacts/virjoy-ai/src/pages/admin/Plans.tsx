import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  is_active: boolean;
  stripe_price_id: string;
};

type PlanInput = Omit<Plan, 'id'>;

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | PlanInput | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('plans').select('*').order('price');
      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error(`Error fetching plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setCurrentPlan({ ...plan });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentPlan({
      name: '',
      description: '',
      price: 0,
      credits: 0,
      is_active: true,
      stripe_price_id: '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPlan(null);
  };

  const handleSave = async () => {
    if (!currentPlan) return;

    const planData: Omit<Plan, 'id'> = {
      name: currentPlan.name,
      description: currentPlan.description,
      price: currentPlan.price,
      credits: currentPlan.credits,
      is_active: currentPlan.is_active,
      stripe_price_id: currentPlan.stripe_price_id,
    };

    setLoading(true);
    try {
      let error;
      if ('id' in currentPlan && currentPlan.id) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', currentPlan.id);
        error = updateError;
      } else {
        // Create new plan
        const { error: insertError } = await supabase.from('plans').insert(planData);
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Plan ${('id' in currentPlan && currentPlan.id) ? 'updated' : 'created'} successfully!`);
      setIsEditing(false);
      setCurrentPlan(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(`Error saving plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentPlan) return;
    const { name, value, type } = e.target;
    
    let finalValue: string | number | boolean = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'price' || name === 'credits') {
      finalValue = Number(value);
    }

    setCurrentPlan({ ...currentPlan, [name]: finalValue });
  };

  if (loading && !isEditing) {
    return <div>Loading plans...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Plans</h1>
        {!isEditing && (
          <button onClick={handleAddNew} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow">
            Add New Plan
          </button>
        )}
      </div>

      {isEditing && currentPlan ? (
        <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
          <h2 className="text-xl font-bold mb-4">
            {'id' in currentPlan && currentPlan.id ? 'Edit Plan' : 'Add New Plan'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="name" value={currentPlan.name} onChange={handleChange} placeholder="Plan Name" className="border p-2 rounded w-full" />
            <input type="text" name="stripe_price_id" value={currentPlan.stripe_price_id} onChange={handleChange} placeholder="Stripe Price ID" className="border p-2 rounded w-full" />
            <input type="number" name="price" value={currentPlan.price} onChange={handleChange} placeholder="Price" className="border p-2 rounded w-full" />
            <input type="number" name="credits" value={currentPlan.credits} onChange={handleChange} placeholder="Credits" className="border p-2 rounded w-full" />
            <textarea name="description" value={currentPlan.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded w-full md:col-span-2" rows={3}></textarea>
            <div className="flex items-center md:col-span-2">
              <input type="checkbox" name="is_active" checked={currentPlan.is_active} onChange={handleChange} id="is_active_check" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="is_active_check" className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={handleCancel} className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <span className={`px-3 py-1 text-sm rounded-full ${plan.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-3xl font-extrabold mb-4">${plan.price}<span className="text-base font-medium text-gray-500">/mo</span></div>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />{plan.credits} credits per month</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Access to all features</li>
                   <li className="flex items-center"><XCircle className="w-5 h-5 text-red-500 mr-2" />Priority Support</li>
                </ul>
              </div>
              <button onClick={() => handleEdit(plan)} className="mt-4 w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-semibold">
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
