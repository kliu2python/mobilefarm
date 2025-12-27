import React, { useEffect, useMemo, useState } from 'react';
import DeviceCard from '../components/DeviceCard';
import DeviceControlPanel from '../components/DeviceControlPanel';
import PageHeader from '../components/PageHeader';
import { useApi } from '../hooks/useApi';

export default function DevicesPage() {
  const { request } = useApi();
  const [devices, setDevices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ os: 'all', provider: 'all', workspace: 'all' });
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [deviceData, wsData] = await Promise.all([
        request('/admin/devices'),
        request('/admin/workspaces?page=1&limit=100'),
      ]);
      setDevices(deviceData.devices || deviceData.Devices || []);
      setProviders(deviceData.providers || deviceData.Providers || []);
      setWorkspaces(wsData.workspaces || wsData.Workspaces || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = search
        ? (device.Name || device.UDID || '').toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesOs = filters.os === 'all' ? true : device.OS?.toLowerCase() === filters.os;
      const matchesProvider = filters.provider === 'all' ? true : device.Provider === filters.provider;
      const matchesWs = filters.workspace === 'all' ? true : device.WorkspaceID === filters.workspace;
      return matchesSearch && matchesOs && matchesProvider && matchesWs;
    });
  }, [devices, search, filters]);

  const release = async (udid) => {
    try {
      await request(`/admin/device/${udid}/release`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Devices"
        subtitle="Search, filter, and jump into a control session with a single click."
        actions={
          <button className="ghost" onClick={load}>
            Refresh
          </button>
        }
      />

      {error && <div className="alert">{error}</div>}

      <div className="panel section-grid">
        <div>
          <label htmlFor="search">Search devices</label>
          <input
            id="search"
            placeholder="Name or UDID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="os">Platform</label>
          <select id="os" value={filters.os} onChange={(e) => setFilters({ ...filters, os: e.target.value })}>
            <option value="all">All</option>
            <option value="android">Android</option>
            <option value="ios">ios</option>
          </select>
        </div>
        <div>
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
          >
            <option value="all">All</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="workspace">Workspace</label>
          <select
            id="workspace"
            value={filters.workspace}
            onChange={(e) => setFilters({ ...filters, workspace: e.target.value })}
          >
            <option value="all">All</option>
            {workspaces.map((ws) => (
              <option key={ws.id || ws.ID} value={ws.id || ws.ID}>
                {ws.name || ws.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="device-grid">
        {filtered.map((device) => (
          <DeviceCard key={device.UDID} device={device} onSelect={setSelected} onRelease={release} />
        ))}
      </div>

      {selected && <DeviceControlPanel device={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
