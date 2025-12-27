import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { isAuthenticated, setToken, setUser } = useAuth();

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <nav>
      <h1>GADS Hub</h1>
      {isAuthenticated ? (
        <>
          <ul>
            <li>
              <NavLink to="/" end>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/providers">Providers</NavLink>
            </li>
            <li>
              <NavLink to="/devices">Devices</NavLink>
            </li>
            <li>
              <NavLink to="/users">Users</NavLink>
            </li>
            <li>
              <NavLink to="/files">Files</NavLink>
            </li>
            <li>
              <NavLink to="/settings">Global settings</NavLink>
            </li>
            <li>
              <NavLink to="/workspaces">Workspaces</NavLink>
            </li>
            <li>
              <NavLink to="/secret-keys">Secret keys</NavLink>
            </li>
            <li>
              <NavLink to="/client-credentials">Client credentials</NavLink>
            </li>
          </ul>
          <button className="secondary" onClick={logout} style={{ marginTop: 16 }}>
            Logout
          </button>
        </>
      ) : (
        <p>Login required</p>
      )}
    </nav>
  );
}
