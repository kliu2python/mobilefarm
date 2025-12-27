import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function SettingsPage() {
  const { request } = useApi();
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState('{}');
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/admin/global-settings')
      .then((data) => {
        setSettings(data);
        setDraft(JSON.stringify(data, null, 2));
      })
      .catch((err) => setError(err.message));
  }, [request]);

  const save = async () => {
    setError(null);
    try {
      await request('/admin/global-settings', { method: 'POST', body: draft });
      const latest = await request('/admin/global-settings');
      setSettings(latest);
      setDraft(JSON.stringify(latest, null, 2));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <h3>Global streaming settings</h3>
          <p>Adjust parameters used by providers and devices.</p>
        </div>
        <button className="secondary" onClick={save}>
          Save changes
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="section-grid">
        <div className="card">
          <h4>Current values</h4>
          {settings ? <pre className="code-block">{JSON.stringify(settings, null, 2)}</pre> : <p>Loading…</p>}
        </div>
        <div className="card">
          <h4>Edit JSON</h4>
          <textarea rows={12} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <p className="alert">JSON is sent directly to the backend API.</p>
        </div>
      </div>
    </div>
  );
}
