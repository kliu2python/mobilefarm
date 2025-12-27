import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
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
    <div className="page">
      <PageHeader
        title="Streaming settings"
        subtitle="Tune FPS, JPEG quality, and scaling factors used across providers."
        actions={
          <button onClick={save}>
            Save changes
          </button>
        }
      />

      {error && <div className="alert">{error}</div>}

      <div className="section-grid">
        <div className="panel">
          <h4>Current values</h4>
          {settings ? <pre className="resource-json">{JSON.stringify(settings, null, 2)}</pre> : <p className="muted">Loading…</p>}
        </div>
        <div className="panel">
          <h4>Edit JSON</h4>
          <textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <p className="muted">JSON is sent directly to the backend API.</p>
        </div>
      </div>
    </div>
  );
}
