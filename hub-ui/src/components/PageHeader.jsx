import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Mobile farm</p>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}
