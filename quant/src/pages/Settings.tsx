import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

interface SettingsData {
  theme: 'light' | 'dark';
  defaultUniverse: string;
  researcherName: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    theme: 'light',
    defaultUniverse: 'US Tech',
    researcherName: 'Trader Mike'
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card title="General Settings">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Researcher Name
            </label>
            <input
              type="text"
              value={settings.researcherName}
              onChange={(e) => setSettings({ ...settings, researcherName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be used in UI headers and reports
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Dark mode is currently under development
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Universe
            </label>
            <select
              value={settings.defaultUniverse}
              onChange={(e) => setSettings({ ...settings, defaultUniverse: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="US Tech">US Tech</option>
              <option value="US Banks">US Banks</option>
              <option value="US Energy">US Energy</option>
              <option value="US Consumer">US Consumer</option>
              <option value="US Industrials">US Industrials</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This universe will be selected by default in filters
            </p>
          </div>
        </div>
      </Card>

      <Card title="Data & Performance">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <div className="text-sm font-medium text-gray-900">Cache Size</div>
              <div className="text-xs text-gray-500">Historical data cached locally</div>
            </div>
            <div className="text-sm text-gray-600">247 MB</div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <div className="text-sm font-medium text-gray-900">Last Sync</div>
              <div className="text-xs text-gray-500">Data synchronization timestamp</div>
            </div>
            <div className="text-sm text-gray-600">2 hours ago</div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Saved Configurations</div>
              <div className="text-xs text-gray-500">Backtest configurations stored</div>
            </div>
            <div className="text-sm text-gray-600">
              {(() => {
                const saved = localStorage.getItem('backtestConfigs');
                const configs = saved ? JSON.parse(saved) : [];
                return configs.length;
              })()}
            </div>
          </div>
        </div>
      </Card>

      <Card title="API Configuration">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              API endpoints are currently configured to use mock data for demonstration purposes.
              Connect to your Python backend by configuring the API base URL in production.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <input
              type="text"
              value="http://localhost:8000/api"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Currently using mock API (read-only)
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
