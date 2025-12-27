import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import DeviceCard from '../components/DeviceCard';
import DeviceControlPanel from '../components/DeviceControlPanel';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

function parseStreamChunk(buffer, onData) {
  const segments = buffer.split('\n\n');
  const incomplete = segments.pop();
  segments.forEach((segment) => {
    const dataLine = segment
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('data:'));
    if (dataLine) {
      const payload = dataLine.replace('data:', '').trim();
      try {
        onData(JSON.parse(payload));
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    }
  });
  return incomplete;
}

export default function DashboardPage() {
  const { request } = useApi();
  const { user, token } = useAuth();
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
    if (!workspaceId) return undefined;

    const decoder = new TextDecoder();
    let buffer = '';
    let controller = new AbortController();
    let reconnectTimer;

    const connect = async () => {
      try {
        const response = await fetch(`/available-devices?workspaceId=${workspaceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Live device stream unavailable');
        }

        const reader = response.body.getReader();

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseStreamChunk(buffer, (payload) => {
            setLiveDevices(payload || []);
            setError(null);
          });
          await read();
        };

        await read();
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Live device stream unavailable');
        reconnectTimer = setTimeout(() => {
          controller.abort();
          controller = new AbortController();
          buffer = '';
          connect();
        }, 1000);
      }
    };

    connect();

    return () => {
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [token, workspaceId]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const available = inventory.filter((d) => d.Available || d.available).length;
    const connected = inventory.filter((d) => d.Connected || d.connected).length;
    const inUse = inventory.filter((d) => d.InUse || d.in_use).length;
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
