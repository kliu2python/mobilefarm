import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/global-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    const data = {
      mjpeg_scale_factor: parseFloat(formData.get('mjpeg_scale_factor')),
      mjpeg_quality: parseInt(formData.get('mjpeg_quality'))
    };

    try {
      await api.post('/admin/global-settings', data);
      alert('Settings saved successfully');
      loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Global Settings</h1>
      </div>

      <div className="settings-panel">
        <form onSubmit={handleSave}>
          <div className="settings-section">
            <h3>Video Stream Settings</h3>

            <div className="form-group">
              <label>MJPEG Scale Factor</label>
              <input
                type="number"
                name="mjpeg_scale_factor"
                step="0.1"
                min="0.1"
                max="1.0"
                defaultValue={settings?.mjpeg_scale_factor || 0.5}
              />
              <small>Scale factor for MJPEG streams (0.1 - 1.0)</small>
            </div>

            <div className="form-group">
              <label>MJPEG Quality</label>
              <input
                type="number"
                name="mjpeg_quality"
                min="1"
                max="100"
                defaultValue={settings?.mjpeg_quality || 50}
              />
              <small>JPEG quality for MJPEG streams (1-100)</small>
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
