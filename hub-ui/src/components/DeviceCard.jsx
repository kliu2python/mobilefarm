import React from 'react';

function StatusPill({ label, tone = 'default' }) {
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

export default function DeviceCard({ device, onSelect, onRelease }) {
  const info = device.info || device;

  const udid = info.UDID || info.udid;
  const name = info.Name || info.name || udid;
  const os = info.OS || info.os;
  const osVersion = info.OSVersion || info.os_version;
  const provider = info.Provider || info.provider;
  const usage = info.Usage || info.usage;
  const connected =
    device.Connected ?? device.connected ?? info.Connected ?? info.connected ?? false;
  const available = device.Available ?? device.available ?? info.Available ?? info.available;
  const inUse = device.InUse ?? device.in_use ?? info.InUse ?? info.in_use;

  return (
    <div className="device-card">
      <div className="device-card__header">
        <div>
          <p className="eyebrow">{provider}</p>
          <h3>{name}</h3>
        </div>
        <div className="device-card__status">
          {connected ? (
            <StatusPill tone="success" label="Connected" />
          ) : (
            <StatusPill tone="danger" label="Offline" />
          )}
          {available && !inUse && <StatusPill tone="info" label="Available" />}
          {inUse && <StatusPill tone="warning" label="In use" />}
        </div>
      </div>

      <div className="device-meta">
        <div>
          <p className="muted">Platform</p>
          <strong>{os} {osVersion}</strong>
        </div>
        <div>
          <p className="muted">Usage</p>
          <strong>{usage}</strong>
        </div>
        <div>
          <p className="muted">UDID</p>
          <code>{udid}</code>
        </div>
      </div>

      <div className="device-card__footer">
        <button className="ghost" onClick={() => onSelect(device)}>
          Open control
        </button>
        {inUse && (
          <button className="text" onClick={() => onRelease(udid)}>
            Release
          </button>
        )}
      </div>
    </div>
  );
}
