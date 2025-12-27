import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Devices.css';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const { selectedWorkspace, isAdmin } = useAuth();
  const eventSourceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // For admin, use default workspace or allow selecting
    const workspaceId = selectedWorkspace?.id;

    if (!workspaceId && !isAdmin) {
      return; // Wait for workspace to be selected
    }

    // For admin without selected workspace, we need to get default workspace
    // For now, let's use a placeholder
    const wsId = workspaceId || 'default';

    // Connect to SSE endpoint for real-time device updates
    const url = `${window.location.origin}/available-devices?workspaceId=${wsId}`;
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onmessage = (event) => {
      try {
        const deviceData = JSON.parse(event.data);
        setDevices(deviceData);
      } catch (error) {
        console.error('Failed to parse device data:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [selectedWorkspace, isAdmin]);

  const handleDeviceClick = (device) => {
    if (device.available && !device.in_use) {
      navigate(`/device/${device.device.udid}`);
    }
  };

  const getDeviceStatus = (device) => {
    if (!device.available) return 'offline';
    if (device.in_use) return 'in-use';
    return 'available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#27ae60';
      case 'in-use':
        return '#f39c12';
      case 'offline':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  if (!selectedWorkspace && !isAdmin) {
    return (
      <div className="devices-container">
        <div className="no-workspace">
          <h2>No Workspace Selected</h2>
          <p>Please wait while we load your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-container">
      <div className="devices-header">
        <h1>Available Devices</h1>
        <p className="device-count">
          {devices.length} device{devices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {devices.length === 0 ? (
        <div className="no-devices">
          <h2>No Devices Available</h2>
          <p>There are no devices in this workspace yet.</p>
        </div>
      ) : (
        <div className="devices-grid">
          {devices.map((device) => {
            const status = getDeviceStatus(device);
            const statusColor = getStatusColor(status);

            return (
              <div
                key={device.device.udid}
                className={`device-card ${status}`}
                onClick={() => handleDeviceClick(device)}
                style={{ cursor: status === 'available' ? 'pointer' : 'default' }}
              >
                <div className="device-status-indicator" style={{ background: statusColor }} />

                <div className="device-info">
                  <h3>{device.device.name || device.device.udid}</h3>

                  <div className="device-details">
                    <div className="detail-row">
                      <span className="label">OS:</span>
                      <span>{device.device.os} {device.device.os_version}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Provider:</span>
                      <span>{device.device.provider}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">UDID:</span>
                      <span className="udid">{device.device.udid}</span>
                    </div>

                    {device.device.screen_width && device.device.screen_height && (
                      <div className="detail-row">
                        <span className="label">Screen:</span>
                        <span>{device.device.screen_width}x{device.device.screen_height}</span>
                      </div>
                    )}
                  </div>

                  <div className="device-status">
                    <span className="status-badge" style={{ background: statusColor }}>
                      {status.toUpperCase()}
                    </span>
                    {device.in_use && device.in_use_by && (
                      <span className="in-use-by">Used by: {device.in_use_by}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
