import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

function parseSseChunk(buffer, onData) {
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

export default function StreamViewerPage() {
  const { udid } = useParams();
  const navigate = useNavigate();
  const { request } = useApi();
  const { token, user } = useAuth();
  const [health, setHealth] = useState(null);
  const [info, setInfo] = useState(null);
  const [inUse, setInUse] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [wsMessage, setWsMessage] = useState('');
  const [error, setError] = useState(null);
  const reconnectRef = useRef(null);

  const streamUrl = useMemo(() => {
    if (!udid || !token) return null;
    return `/device/${udid}/ios-stream-mjpeg?token=${encodeURIComponent(`Bearer ${token}`)}`;
  }, [udid, token]);

  const wsUrl = useMemo(() => {
    if (!udid || !token) return null;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/devices/control/${udid}/in-use?token=${encodeURIComponent(
      `Bearer ${token}`
    )}`;
  }, [udid, token]);

  useEffect(() => {
    if (!udid) return;

    request(`/device/${udid}/health`)
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));

    request(`/device/${udid}/info`)
      .then((data) => setInfo(data.result || data))
      .catch((err) => setError(err.message));
  }, [request, udid]);

  useEffect(() => {
    if (!wsUrl) return undefined;

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setWsStatus('open');
    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => setWsStatus('closed');
    ws.onmessage = (event) => {
      setWsMessage(event.data);
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.type === 'ping') {
          ws.send(user?.username || 'ping');
        }
      } catch (err) {
        // Non-JSON payloads are ignored but retained for debugging display
      }
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, user?.username]);

  useEffect(() => {
    const workspace = info?.workspace_id || info?.WorkspaceID || info?.workspaceId;
    if (!token || !workspace) return undefined;

    const controller = new AbortController();
    const decoder = new TextDecoder();
    let buffer = '';

    const connect = async () => {
      try {
        const response = await fetch(`/available-devices?workspaceId=${workspace}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.body) {
          throw new Error('Live availability stream unavailable');
        }

        const reader = response.body.getReader();

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) return;

          buffer += decoder.decode(value, { stream: true });
          buffer = parseSseChunk(buffer, (payload) => {
            const latest = payload.find((device) => (device?.Device?.UDID || device?.Device?.Udid) === udid);
            if (latest) {
              setInUse(latest.InUse ?? latest.in_use ?? false);
            }
          });
          await read();
        };

        await read();
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Failed to keep availability updated');
        reconnectRef.current = setTimeout(connect, 1000);
      }
    };

    connect();

    return () => {
      controller.abort();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [info?.workspace_id, info?.WorkspaceID, info?.workspaceId, token, udid]);

  return (
    <div className="page">
      <PageHeader
        title="Live stream viewer"
        subtitle="Health, control channel, and MJPEG feed rendered in a dedicated view."
        actions={
          <div className="hero-cta">
            <button className="ghost" onClick={() => navigate(-1)}>
              Back
            </button>
            <button className="ghost" onClick={() => window.location.reload()}>
              Reload stream
            </button>
          </div>
        }
      />

      {error && <div className="alert">{error}</div>}

      <div className="panel section-grid">
        <div>
          <p className="muted">Device health</p>
          <strong>{health?.message || '—'}</strong>
        </div>
        <div>
          <p className="muted">Control channel</p>
          <strong className={`pill pill-${wsStatus === 'open' ? 'success' : 'warning'}`}>{wsStatus}</strong>
          {wsMessage && <p className="muted">{wsMessage}</p>}
        </div>
        <div>
          <p className="muted">In use</p>
          <strong className={`pill pill-${inUse ? 'warning' : 'success'}`}>{inUse ? 'Yes' : 'No'}</strong>
        </div>
        <div>
          <p className="muted">Resolution</p>
          <strong>
            {info?.screen_width || info?.ScreenWidth || '—'} × {info?.screen_height || info?.ScreenHeight || '—'}
          </strong>
        </div>
      </div>

      <div className="panel">
        <div className="device-frame">
          <div className="device-glow" />
          <div className="device-preview live">
            <div className="status-row">
              <span className="pill pill-info">MJPEG stream</span>
              <span className="pill pill-dark">{udid}</span>
            </div>
            {streamUrl ? (
              <img className="stream-view" src={streamUrl} alt={`Live stream for ${udid}`} />
            ) : (
              <p className="muted">Stream unavailable: missing token.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
