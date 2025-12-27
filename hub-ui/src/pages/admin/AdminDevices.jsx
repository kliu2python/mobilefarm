import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devicesRes, workspacesRes] = await Promise.all([
        api.get('/admin/devices'),
        api.get('/admin/workspaces')
      ]);
      setDevices(devicesRes.data?.devices || []);
      setProviders(devicesRes.data?.providers || []);
      setWorkspaces(workspacesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (udid) => {
    if (!window.confirm(`Are you sure you want to delete device "${udid}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/device/${udid}`);
      alert('Device deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Device Management</h1>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>UDID</th>
              <th>OS</th>
              <th>Provider</th>
              <th>Workspace</th>
              <th>Connected</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const workspace = workspaces.find(w => w.id === device.workspace_id);
              return (
                <tr key={device.udid}>
                  <td><strong>{device.name || device.udid}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{device.udid}</td>
                  <td>{device.os} {device.os_version}</td>
                  <td>{device.provider}</td>
                  <td>{workspace?.name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${device.connected ? 'live' : 'offline'}`}>
                      {device.connected ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(device.udid)} className="btn-small btn-danger">Delete</button>
                  </td>
                </tr>
              );
            })}
            {devices.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  No devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
