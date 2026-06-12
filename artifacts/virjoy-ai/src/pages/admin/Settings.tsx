import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Define a type for your settings for stronger type checking
type AppSettings = {
  maintenance_mode: boolean;
  new_user_credits: number;
  max_video_duration: number; // in seconds
  // Add any other settings you might have
};

const AdminSettings: React.FC = () => {
  // Initialize state with a structure that matches your settings
  const [settings, setSettings] = useState<AppSettings>({
    maintenance_mode: false,
    new_user_credits: 10,
    max_video_duration: 300,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single(); // Assuming you have a single row for settings
      
      if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
        throw error;
      }
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      toast.error(`Error fetching settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use upsert to create settings if they don't exist, or update if they do.
      // This requires a primary key on the table, e.g., a 'id' field with a default value.
      const { error } = await supabase.from('app_settings').upsert(settings, {
        onConflict: 'id', // Replace 'id' with your actual primary key column
      });

      if (error) {
        throw error;
      }
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(`Error saving settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Application Settings</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-semibold">Maintenance Mode</h2>
              <p className="text-sm text-gray-500">Temporarily disable user access to the app.</p>
            </div>
            <label htmlFor="maintenance-toggle" className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="maintenance-toggle" 
                name="maintenance_mode"
                className="sr-only peer"
                checked={settings.maintenance_mode}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* New User Credits */}
          <div className="border-b pb-4">
            <label htmlFor="new-user-credits" className="block text-lg font-semibold mb-2">New User Credits</label>
            <p className="text-sm text-gray-500 mb-2">The number of credits a new user gets upon signing up.</p>
            <input 
              type="number" 
              id="new-user-credits"
              name="new_user_credits"
              value={settings.new_user_credits}
              onChange={handleChange}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Max Video Duration */}
          <div className="border-b pb-4">
            <label htmlFor="max-video-duration" className="block text-lg font-semibold mb-2">Max Video Duration (seconds)</label>
            <p className="text-sm text-gray-500 mb-2">The maximum allowed duration for a generated video.</p>
            <input 
              type="number" 
              id="max-video-duration"
              name="max_video_duration"
              value={settings.max_video_duration}
              onChange={handleChange}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-8 text-right">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-lg"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
