import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import DeviceCard from '../components/DeviceCard';
import DeviceControlPanel from '../components/DeviceControlPanel';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { request } = useApi();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [liveDevices, setLiveDevices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/admin/workspaces?page=1&limit=50')
      .then((data) => {
        const ws = data?.workspaces || data?.Workspaces || [];
        setWorkspaces(ws);
        if (ws.length > 0) {
          const defaultWs = ws.find((w) => w.is_default || w.IsDefault) || ws[0];
          setWorkspaceId(defaultWs.id || defaultWs.ID || defaultWs._id);
        }
      })
      .catch((err) => setError(err.message));
  }, [request]);

  useEffect(() => {
    request('/admin/devices')
      .then((data) => setInventory(data?.Devices || data?.devices || []))
      .catch((err) => setError(err.message));
  }, [request]);

  useEffect(() => {
    if (!workspaceId) return;
    const es = new EventSource(`/available-devices?workspaceId=${workspaceId}`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLiveDevices(payload || []);
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };
    es.onerror = () => setError('Live device stream unavailable');
    return () => es.close();
  }, [workspaceId]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const available = inventory.filter((d) => d.Available).length;
    const connected = inventory.filter((d) => d.Connected).length;
    const inUse = inventory.filter((d) => d.InUse).length;
    return [
      { label: 'Devices', value: total },
      { label: 'Available', value: available },
      { label: 'Connected', value: connected },
      { label: 'In use', value: inUse },
    ];
  }, [inventory]);

  return (
    <div className="page">
      <PageHeader
        title={`Hi${user ? `, ${user.username}` : ''}`}
        subtitle="Track availability, stream status, and jump into control faster."
        actions={
          <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}>
            {workspaces.map((ws) => (
              <option key={ws.id || ws.ID} value={ws.id || ws.ID}>
                {ws.name || ws.Name}
              </option>
            ))}
          </select>
        }
      />

      <div className="hero-card">
        <h2>Modern device farm overview</h2>
        <p className="muted">Live availability streamed straight from the hub. Use the workspace switcher to scope the grid.</p>
        <div className="hero-meta">
          {stats.map((stat) => (
            <div key={stat.label} className="pill pill-dark">
              <strong>{stat.value}</strong> {stat.label}
            </div>
          ))}
        </div>
        <div className="hero-cta">
          <button onClick={() => setSelected(liveDevices[0])} disabled={!liveDevices.length}>
            Open first available
          </button>
          <button className="ghost" onClick={() => setInventory([...inventory])}>
            Refresh inventory
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <h3>Available now</h3>
      <div className="device-grid">
        {liveDevices.length === 0 && <p className="muted">No devices currently streaming for this workspace.</p>}
        {liveDevices.map((device) => (
          <DeviceCard key={device.info?.udid || device.info?.UDID} device={device.info || device} onSelect={setSelected} onRelease={() => {}} />
        ))}
      </div>

      {selected && <DeviceControlPanel device={selected.info || selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
