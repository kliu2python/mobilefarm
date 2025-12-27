import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, workspacesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/workspaces')
      ]);
      setUsers(usersRes.data || []);
      setWorkspaces(workspacesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load users or workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/user/${username}`);
      alert('User deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setCurrentUser({ ...user, password: '' });
    setShowModal(true);
  };

  const handleAdd = () => {
    setCurrentUser({
      username: '',
      password: '',
      role: 'user',
      workspace_ids: []
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
      role: formData.get('role'),
      workspace_ids: formData.getAll('workspace_ids')
    };

    // Don't send empty password on update
    if (!data.password && currentUser?.username && users.find(u => u.username === currentUser.username)) {
      delete data.password;
    }

    try {
      if (currentUser?.username && users.find(u => u.username === currentUser.username)) {
        await api.put('/admin/user', data);
        alert('User updated successfully');
      } else {
        if (!data.password) {
          alert('Password is required for new users');
          return;
        }
        await api.post('/admin/user', data);
        alert('User added successfully');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.error || 'Failed to save user');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <button onClick={handleAdd} className="btn-primary">Add User</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Workspaces</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td><strong>{user.username}</strong></td>
                <td>
                  <span className={`status-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {user.role === 'admin' ? (
                    <em>All workspaces</em>
                  ) : (
                    user.workspace_ids?.map(wsId => {
                      const ws = workspaces.find(w => w.id === wsId);
                      return ws ? ws.name : wsId;
                    }).join(', ') || 'None'
                  )}
                </td>
                <td>
                  <button onClick={() => handleEdit(user)} className="btn-small">Edit</button>
                  {user.username !== 'admin' && (
                    <button onClick={() => handleDelete(user.username)} className="btn-small btn-danger">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentUser?.username && users.find(u => u.username === currentUser.username) ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  defaultValue={currentUser?.username}
                  required
                  readOnly={!!currentUser?.username && users.find(u => u.username === currentUser.username)}
                />
              </div>

              <div className="form-group">
                <label>Password {!currentUser?.username ? '*' : '(leave empty to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  placeholder={currentUser?.username ? 'Leave empty to keep current password' : 'Enter password'}
                  required={!currentUser?.username}
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select name="role" defaultValue={currentUser?.role} required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Workspaces (select multiple for regular users)</label>
                <select
                  name="workspace_ids"
                  multiple
                  size="5"
                  defaultValue={currentUser?.workspace_ids || []}
                  style={{ height: 'auto', minHeight: '120px' }}
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
                <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
                  Hold Ctrl/Cmd to select multiple workspaces
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
