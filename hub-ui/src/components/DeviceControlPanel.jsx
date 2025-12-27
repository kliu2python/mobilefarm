import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function DeviceControlPanel({ device, onClose }) {
  const { request } = useApi();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const controlUrl = useMemo(() => `/device/${device.UDID}/status`, [device.UDID]);

  const release = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await request(`/admin/device/${device.UDID}/release`, { method: 'POST' });
      setMessage('Device release requested');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (text) => {
    await navigator.clipboard.writeText(text);
    setMessage('Copied link to clipboard');
  };

  return (
    <div className="control-panel">
      <div className="control-panel__header">
        <div>
          <p className="eyebrow">Control</p>
          <h2>{device.Name || device.UDID}</h2>
          <p className="muted">{device.OS} {device.OSVersion} · {device.Provider}</p>
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </div>

      <div className="control-grid">
        <div className="preview-card">
          <div className="device-frame">
            <div className="device-glow" />
            <div className="device-preview">
              <div className="status-row">
                <span className={`pill pill-${device.Connected ? 'success' : 'danger'}`}>
                  {device.Connected ? 'Online' : 'Offline'}
                </span>
                {device.InUse && <span className="pill pill-warning">In use</span>}
              </div>
              <div className="device-preview__body">
                <p className="muted">Live screen stream</p>
                <h4>Connect through your preferred viewer</h4>
                <p className="muted">Use the device proxy endpoint to pull MJPEG or WebRTC streams.</p>
                <div className="stacked-links">
                  <button className="ghost" onClick={() => copyLink(controlUrl)}>
                    Copy device status endpoint
                  </button>
                  <button className="ghost" onClick={() => copyLink(`/grid/device/${device.UDID}`)}>
                    Copy Appium Grid target
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h4>Quick actions</h4>
          <div className="action-grid">
            <button disabled={loading} onClick={release}>Force release</button>
            <a className="ghost" href={controlUrl} target="_blank" rel="noreferrer">
              Open device status
            </a>
            <a className="ghost" href={`/device/${device.UDID}/appium/logs`} target="_blank" rel="noreferrer">
              Appium logs
            </a>
          </div>
          <p className="muted">These actions reuse the existing proxy endpoints so backend behavior remains unchanged.</p>
        </div>

        <div className="panel-section">
          <h4>Device metadata</h4>
          <div className="meta-grid">
            <div>
              <p className="muted">UDID</p>
              <code>{device.UDID}</code>
            </div>
            <div>
              <p className="muted">Resolution</p>
              <strong>
                {device.ScreenWidth || '—'} × {device.ScreenHeight || '—'}
              </strong>
            </div>
            <div>
              <p className="muted">Workspace</p>
              <strong>{device.WorkspaceID || 'Unassigned'}</strong>
            </div>
            <div>
              <p className="muted">Appium</p>
              <strong>{device.IsAppiumUp ? 'Ready' : 'Not running'}</strong>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}
    </div>
  );
}
