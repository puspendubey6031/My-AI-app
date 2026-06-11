import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Key, Coins, Wrench } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    openai_key: '',
    replicate_key: '',
    default_credits: 100,
    per_video_cost: 10,
    maintenance_mode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (data) setSettings(data)
    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('app_settings')
      .update({ ...settings, updated_at: new Date() })
      .eq('id', 1)
    
    if (error) alert('Error: ' + error.message)
    else alert('Settings saved!')
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-white">Loading...</div>

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-white">API & App Settings</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <Key className="w-5 h-5 mr-2 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">API Keys</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm">OpenAI API Key</label>
              <input 
                type="password"
                value={settings.openai_key || ''}
                onChange={(e) => setSettings({...settings, openai_key: e.target.value})}
                className="w-full bg-gray-900 text-white p-2 rounded mt-1 border border-gray-700"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Replicate API Key</label>
              <input 
                type="password"
                value={settings.replicate_key || ''}
                onChange={(e) => setSettings({...settings, replicate_key: e.target.value})}
                className="w-full bg-gray-900 text-white p-2 rounded mt-1 border border-gray-700"
                placeholder="r8_..."
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center mb-3">
            <Coins className="w-5 h-5 mr-2 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Credits Settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm">Default Credits for New User</label>
              <input 
                type="number"
                value={settings.default_credits}
                onChange={(e) => setSettings({...settings, default_credits: Number(e.target.value)})}
                className="w-full bg-gray-900 text-white p-2 rounded mt-1 border border-gray-700"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Credits Cost Per Video</label>
              <input 
                type="number"
                value={settings.per_video_cost}
                onChange={(e) => setSettings({...settings, per_video_cost: Number(e.target.value)})}
                className="w-full bg-gray-900 text-white p-2 rounded mt-1 border border-gray-700"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center mb-3">
            <Wrench className="w-5 h-5 mr-2 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Maintenance</h2>
          </div>
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
              className="w-4 h-4 mr-2"
            />
            <span className="text-gray-300">Enable Maintenance Mode</span>
          </label>
        </div>

        <button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}