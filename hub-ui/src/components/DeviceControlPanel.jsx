import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function DeviceControlPanel({ device, onClose }) {
  const { request } = useApi();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const info = device.info || device;

  const udid = info.UDID || info.udid;
  const name = info.Name || info.name || udid;
  const os = info.OS || info.os;
  const osVersion = info.OSVersion || info.os_version;
  const provider = info.Provider || info.provider;
  const connected =
    device.Connected ?? device.connected ?? info.Connected ?? info.connected ?? false;
  const inUse = device.InUse ?? device.in_use ?? info.InUse ?? info.in_use;

  const screenWidth = info.ScreenWidth || info.screen_width;
  const screenHeight = info.ScreenHeight || info.screen_height;
  const workspaceId = info.WorkspaceID || info.workspace_id;
  const isAppiumUp = info.IsAppiumUp ?? info.is_appium_up;

  const controlUrl = useMemo(() => `/device/${udid}/status`, [udid]);

  const release = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await request(`/admin/device/${udid}/release`, { method: 'POST' });
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
          <h2>{name}</h2>
          <p className="muted">{os} {osVersion} · {provider}</p>
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </div>

      <div className="control-grid">
        <div className="preview-card">
          <div className="device-frame">
            <div className="device-glow" />
            <div className="device-preview">
              <div className="status-row">
                <span className={`pill pill-${connected ? 'success' : 'danger'}`}>
                  {connected ? 'Online' : 'Offline'}
                </span>
                {inUse && <span className="pill pill-warning">In use</span>}
              </div>
              <div className="device-preview__body">
                <p className="muted">Live screen stream</p>
                <h4>Connect through your preferred viewer</h4>
                <p className="muted">Use the device proxy endpoint to pull MJPEG or WebRTC streams.</p>
                <div className="stacked-links">
                  <button className="ghost" onClick={() => copyLink(controlUrl)}>
                    Copy device status endpoint
                  </button>
                  <button className="ghost" onClick={() => copyLink(`/grid/device/${udid}`)}>
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
            <a className="ghost" href={`/device/${udid}/appium/logs`} target="_blank" rel="noreferrer">
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
              <code>{udid}</code>
            </div>
            <div>
              <p className="muted">Resolution</p>
              <strong>
                {screenWidth || '—'} × {screenHeight || '—'}
              </strong>
            </div>
            <div>
              <p className="muted">Workspace</p>
              <strong>{workspaceId || 'Unassigned'}</strong>
            </div>
            <div>
              <p className="muted">Appium</p>
              <strong>{isAppiumUp ? 'Ready' : 'Not running'}</strong>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}
    </div>
  );
}
