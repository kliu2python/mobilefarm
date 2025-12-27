import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DeviceControl.css';

export default function DeviceControl() {
  const { udid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Connect to WebSocket for device in-use status
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/devices/control/${udid}/in-use?token=${encodeURIComponent(token)}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnected(true);
      setError(null);

      // Send initial message with username
      wsRef.current.send(user.username);

      // Set up ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(user.username);
        }
      }, 1500);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'releaseDevice') {
          alert('Device has been released by admin');
          navigate('/');
        } else if (message.type === 'sessionExpired') {
          alert('Your session has expired due to inactivity');
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to device');
      setConnected(false);
    };

    wsRef.current.onclose = () => {
      setConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [udid, user, navigate]);

  // Load device stream
  useEffect(() => {
    if (connected) {
      streamRef.current = `/device/${udid}/stream`;
    }
  }, [connected, udid]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="device-control-container">
      <div className="control-header">
        <button onClick={handleBack} className="btn-back">← Back to Devices</button>
        <h1>Device Control</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Connected' : '● Disconnected'}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="device-viewer">
        {connected ? (
          <div className="stream-container">
            <iframe
              src={`/device/${udid}/`}
              title="Device Stream"
              className="device-iframe"
              allow="autoplay; clipboard-write"
            />
          </div>
        ) : (
          <div className="connecting-message">
            <div className="spinner"></div>
            <p>Connecting to device...</p>
          </div>
        )}
      </div>

      <div className="device-info-panel">
        <h3>Device: {udid}</h3>
        <p>User: {user?.username}</p>
        <p className="info-text">
          This device is now reserved for you. It will automatically be released after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
}
