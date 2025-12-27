import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/devices', label: 'Devices' },
  { to: '/providers', label: 'Providers' },
  { to: '/users', label: 'Users' },
  { to: '/files', label: 'Files' },
  { to: '/settings', label: 'Settings' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/secret-keys', label: 'Secret Keys' },
  { to: '/client-credentials', label: 'Client Credentials' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo-block">
        <div className="logo-mark">DF</div>
        <div>
          <div className="logo-title">Device Farm</div>
          <div className="logo-subtitle">Control hub</div>
        </div>
      </div>
      <nav>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
