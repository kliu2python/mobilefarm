import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout, isAdmin, selectedWorkspace, workspaces, setSelectedWorkspace } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>GADS Device Farm</h2>
        </div>

        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Devices
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/admin/providers" className={({ isActive }) => isActive ? 'active' : ''}>
                Providers
              </NavLink>
              <NavLink to="/admin/devices" className={({ isActive }) => isActive ? 'active' : ''}>
                Manage Devices
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
                Users
              </NavLink>
              <NavLink to="/admin/workspaces" className={({ isActive }) => isActive ? 'active' : ''}>
                Workspaces
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                Settings
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-user">
          {!isAdmin && workspaces.length > 1 && (
            <select
              value={selectedWorkspace?.id || ''}
              onChange={(e) => {
                const ws = workspaces.find(w => w.id === e.target.value);
                setSelectedWorkspace(ws);
              }}
              className="workspace-select"
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}
          <span className="username">{user?.username}</span>
          {isAdmin && <span className="badge">Admin</span>}
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
