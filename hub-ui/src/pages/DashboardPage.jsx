import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const { request } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    request('/user-info')
      .then(setUserInfo)
      .catch((err) => setError(err.message));
  }, [request]);

  useEffect(() => {
    const es = new EventSource('/available-devices');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setAvailableDevices(payload.devices || []);
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };
    es.onerror = () => {
      setError('Live device stream unavailable');
    };
    return () => es.close();
  }, []);

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <h2>Welcome back{user ? `, ${user.username}` : ''}</h2>
          <p>Monitor available devices and your account details.</p>
        </div>
        {user && <span className="badge">{user.role}</span>}
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="section-grid">
        <div className="card">
          <h3>User info</h3>
          {userInfo ? (
            <pre className="code-block">{JSON.stringify(userInfo, null, 2)}</pre>
          ) : (
            <p>Loading account details…</p>
          )}
        </div>
        <div className="card">
          <h3>Available devices</h3>
          {availableDevices.length === 0 ? (
            <p>No devices currently available.</p>
          ) : (
            <ul>
              {availableDevices.map((device) => (
                <li key={device.udid}>
                  <strong>{device.name || device.udid}</strong> — {device.platform}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
