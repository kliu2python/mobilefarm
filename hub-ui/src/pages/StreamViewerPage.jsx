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
  const [actionMessage, setActionMessage] = useState('');
  const [installedApps, setInstalledApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [textInput, setTextInput] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const reconnectRef = useRef(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  const dragRef = useRef(null);

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
    if (!udid) return;

    request(`/device/${udid}/apps`)
      .then((data) => {
        const apps = data.result || data;
        setInstalledApps(apps || []);
        setSelectedApp((apps || [])[0] || '');
      })
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

  const mapToDeviceCoordinates = (clientX, clientY) => {
    const element = streamRef.current || frameRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const ratioX = (clientX - rect.left) / rect.width;
    const ratioY = (clientY - rect.top) / rect.height;
    const screenWidth = info?.screen_width || info?.ScreenWidth;
    const screenHeight = info?.screen_height || info?.ScreenHeight;
    if (!screenWidth || !screenHeight) return null;
    return {
      x: Math.round(ratioX * screenWidth),
      y: Math.round(ratioY * screenHeight),
    };
  };

  const sendCommand = async (path, payload = null, options = {}) => {
    setActionMessage('');
    try {
      const isForm = payload instanceof FormData;
      const response = await request(`/device/${udid}${path}`, {
        method: options.method || 'POST',
        body: isForm || payload === null ? payload : JSON.stringify(payload),
        headers: options.headers,
      });
      const nextMessage = response?.message || 'Action executed';
      setActionMessage(nextMessage);
      if (options.onSuccess) options.onSuccess(response);
    } catch (err) {
      setActionMessage(err.message);
    }
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    const mapped = mapToDeviceCoordinates(event.clientX, event.clientY);
    if (!mapped) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      start: mapped,
      clientStart: { x: event.clientX, y: event.clientY },
    };
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current) return;
    const end = mapToDeviceCoordinates(event.clientX, event.clientY);
    if (!end) return;
    const { start, clientStart } = dragRef.current;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const distance = Math.hypot(event.clientX - clientStart.x, event.clientY - clientStart.y);
    if (distance < 10) {
      sendCommand('/tap', { x: start.x, y: start.y });
    } else {
      sendCommand('/swipe', { x: start.x, y: start.y, endX: end.x, endY: end.y });
    }
  };

  const swipeDirection = (direction) => {
    const width = info?.screen_width || info?.ScreenWidth;
    const height = info?.screen_height || info?.ScreenHeight;
    if (!width || !height) return;

    const centerX = Math.round(width / 2);
    const centerY = Math.round(height / 2);
    const offset = Math.round(Math.min(width, height) * 0.25);

    const deltas = {
      up: { endX: centerX, endY: centerY - offset },
      down: { endX: centerX, endY: centerY + offset },
      left: { endX: centerX - offset, endY: centerY },
      right: { endX: centerX + offset, endY: centerY },
    };

    const delta = deltas[direction];
    if (!delta) return;

    sendCommand('/swipe', {
      x: centerX,
      y: centerY,
      endX: delta.endX,
      endY: delta.endY,
    });
  };

  const rotateOrientation = (nextOrientation) => {
    setOrientation(nextOrientation);
    sendCommand('/update-stream-settings', { orientation: nextOrientation });
  };

  const requestScreenshot = () => {
    sendCommand('/screenshot', null, {
      onSuccess: (response) => {
        const data = response?.result || response?.screenshot || '';
        if (data) {
          setScreenshot(`data:image/png;base64,${data}`);
        }
      },
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    await sendCommand('/uploadAndInstallApp', formData, {
      onSuccess: () => {
        request(`/device/${udid}/apps`).then((data) => {
          const apps = data.result || data;
          setInstalledApps(apps || []);
          setSelectedApp((apps || [])[0] || '');
        });
      },
    });
    setUploading(false);
    event.target.value = '';
  };

  const uninstallSelectedApp = () => {
    if (!selectedApp) return;
    sendCommand('/uninstallApp', { app: selectedApp }, {
      onSuccess: (res) => {
        const apps = res?.result || installedApps.filter((app) => app !== selectedApp);
        setInstalledApps(apps || []);
        setSelectedApp((apps || [])[0] || '');
      },
    });
  };

  return (
    <div className="page">
      <PageHeader
        title="Live stream viewer"
        subtitle="Health, control channel, and MJPEG feed rendered in a dedicated view."
        actions={
          <div className="hero-cta">
            <button className="ghost" onClick={() => navigate('/devices')}>
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

      <div className="panel section-grid">
        <div>
          <h4>Controls</h4>
          <div className="button-row">
            <button className="ghost" onClick={() => sendCommand('/lock')}>Lock</button>
            <button className="ghost" onClick={() => sendCommand('/unlock')}>Unlock</button>
            <button className="ghost" onClick={() => sendCommand('/home')}>Home</button>
            <button className="ghost" onClick={requestScreenshot}>Screenshot</button>
          </div>
          <div className="button-row">
            <button className="ghost" onClick={() => swipeDirection('left')} disabled={!info}>Swipe left</button>
            <button className="ghost" onClick={() => swipeDirection('right')} disabled={!info}>Swipe right</button>
            <button className="ghost" onClick={() => swipeDirection('up')} disabled={!info}>Swipe up</button>
            <button className="ghost" onClick={() => swipeDirection('down')} disabled={!info}>Swipe down</button>
          </div>
          <div className="button-row">
            <button
              className={`ghost ${orientation === 'portrait' ? 'active' : ''}`}
              onClick={() => rotateOrientation('portrait')}
            >
              Portrait
            </button>
            <button
              className={`ghost ${orientation === 'landscape' ? 'active' : ''}`}
              onClick={() => rotateOrientation('landscape')}
            >
              Landscape
            </button>
          </div>
          <label htmlFor="typeText">Type text</label>
          <div className="button-row">
            <input
              id="typeText"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type something and press send"
            />
            <button className="ghost" onClick={() => sendCommand('/typeText', { text: textInput })} disabled={!textInput}>
              Send
            </button>
          </div>
          <div className="button-row">
            <label className="ghost" htmlFor="upload-app">
              {uploading ? 'Uploading…' : 'Upload and install app'}
            </label>
            <input id="upload-app" type="file" onChange={handleUpload} style={{ display: 'none' }} />
          </div>
          <div className="button-row">
            <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
              {installedApps.map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
            </select>
            <button className="ghost" onClick={uninstallSelectedApp} disabled={!selectedApp}>
              Uninstall app
            </button>
          </div>
          {actionMessage && <p className="muted">{actionMessage}</p>}
          {screenshot && (
            <div className="stacked-links">
              <img src={screenshot} alt="Latest screenshot" className="stream-view" />
              <a className="ghost" href={screenshot} download={`screenshot-${udid}.png`}>
                Download screenshot
              </a>
            </div>
          )}
        </div>

        <div>
          <div className="device-frame" ref={frameRef}>
            <div className="device-glow" />
            <div className="device-preview live">
              <div className="status-row">
                <span className="pill pill-info">MJPEG stream</span>
                <span className="pill pill-dark">{udid}</span>
              </div>
              {streamUrl ? (
                <img
                  className={`stream-view ${orientation === 'landscape' ? 'landscape' : ''}`}
                  src={streamUrl}
                  alt={`Live stream for ${udid}`}
                  ref={streamRef}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerMove={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              ) : (
                <p className="muted">Stream unavailable: missing token.</p>
              )}
              <p className="muted">Tap or drag on the stream to send touch or swipe commands.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
