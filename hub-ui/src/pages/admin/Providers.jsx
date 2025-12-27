import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await api.get('/admin/providers');
      setProviders(response.data || []);
    } catch (error) {
      console.error('Failed to load providers:', error);
      alert('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (nickname) => {
    if (!window.confirm(`Are you sure you want to delete provider "${nickname}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/providers/${nickname}`);
      alert('Provider deleted successfully');
      loadProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider');
    }
  };

  const handleEdit = (provider) => {
    setCurrentProvider(provider);
    setShowModal(true);
  };

  const handleAdd = () => {
    setCurrentProvider({
      nickname: '',
      os: '',
      host_address: '',
      port: 0,
      use_selenium_grid: false,
      selenium_grid: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert to appropriate types
    data.port = parseInt(data.port);
    data.use_selenium_grid = data.use_selenium_grid === 'true';

    try {
      if (currentProvider.nickname && providers.find(p => p.nickname === currentProvider.nickname)) {
        await api.post('/admin/providers/update', data);
        alert('Provider updated successfully');
      } else {
        await api.post('/admin/providers/add', data);
        alert('Provider added successfully');
      }
      setShowModal(false);
      loadProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
      alert(error.response?.data?.error || 'Failed to save provider');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Provider Management</h1>
        <button onClick={handleAdd} className="btn-primary">Add Provider</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nickname</th>
              <th>OS</th>
              <th>Address</th>
              <th>Port</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.nickname}>
                <td><strong>{provider.nickname}</strong></td>
                <td>{provider.os}</td>
                <td>{provider.host_address}</td>
                <td>{provider.port}</td>
                <td>
                  <span className={`status-badge ${provider.state === 'live' ? 'live' : 'offline'}`}>
                    {provider.state || 'unknown'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(provider)} className="btn-small">Edit</button>
                  <button onClick={() => handleDelete(provider.nickname)} className="btn-small btn-danger">Delete</button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                  No providers found. Add your first provider to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentProvider?.nickname && providers.find(p => p.nickname === currentProvider.nickname) ? 'Edit Provider' : 'Add Provider'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nickname *</label>
                <input
                  type="text"
                  name="nickname"
                  defaultValue={currentProvider?.nickname}
                  required
                  readOnly={!!currentProvider?.nickname && providers.find(p => p.nickname === currentProvider.nickname)}
                />
              </div>

              <div className="form-group">
                <label>OS *</label>
                <select name="os" defaultValue={currentProvider?.os} required>
                  <option value="">Select OS</option>
                  <option value="darwin">macOS</option>
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                </select>
              </div>

              <div className="form-group">
                <label>Host Address *</label>
                <input
                  type="text"
                  name="host_address"
                  defaultValue={currentProvider?.host_address}
                  placeholder="e.g., 192.168.1.100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Port *</label>
                <input
                  type="number"
                  name="port"
                  defaultValue={currentProvider?.port}
                  placeholder="e.g., 10001"
                  required
                />
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
