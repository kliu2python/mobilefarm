import React from 'react';

function StatusPill({ label, tone = 'default' }) {
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

export default function DeviceCard({ device, onSelect, onRelease }) {
  const { UDID, Name, OS, OSVersion, Provider, Usage, Connected, Available, InUse } = device;

  return (
    <div className="device-card">
      <div className="device-card__header">
        <div>
          <p className="eyebrow">{Provider}</p>
          <h3>{Name || UDID}</h3>
        </div>
        <div className="device-card__status">
          {Connected ? (
            <StatusPill tone="success" label="Connected" />
          ) : (
            <StatusPill tone="danger" label="Offline" />
          )}
          {Available && !InUse && <StatusPill tone="info" label="Available" />}
          {InUse && <StatusPill tone="warning" label="In use" />}
        </div>
      </div>

      <div className="device-meta">
        <div>
          <p className="muted">Platform</p>
          <strong>{OS} {OSVersion}</strong>
        </div>
        <div>
          <p className="muted">Usage</p>
          <strong>{Usage}</strong>
        </div>
        <div>
          <p className="muted">UDID</p>
          <code>{UDID}</code>
        </div>
      </div>

      <div className="device-card__footer">
        <button className="ghost" onClick={() => onSelect(device)}>
          Open control
        </button>
        {InUse && (
          <button className="text" onClick={() => onRelease(UDID)}>
            Release
          </button>
        )}
      </div>
    </div>
  );
}
