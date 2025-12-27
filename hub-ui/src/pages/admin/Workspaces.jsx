import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await api.get('/admin/workspaces');
      setWorkspaces(response.data || []);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      alert('Cannot delete the default workspace');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this workspace?')) {
      return;
    }

    try {
      await api.delete(`/admin/workspaces/${id}`);
      alert('Workspace deleted successfully');
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace');
    }
  };

  const handleEdit = (workspace) => {
    setCurrentWorkspace(workspace);
    setShowModal(true);
  };

  const handleAdd = () => {
    setCurrentWorkspace({
      name: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    try {
      if (currentWorkspace?.id) {
        await api.put('/admin/workspaces', { ...data, id: currentWorkspace.id });
        alert('Workspace updated successfully');
      } else {
        await api.post('/admin/workspaces', data);
        alert('Workspace created successfully');
      }
      setShowModal(false);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to save workspace:', error);
      alert(error.response?.data?.error || 'Failed to save workspace');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Workspace Management</h1>
        <button onClick={handleAdd} className="btn-primary">Add Workspace</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Default</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((workspace) => (
              <tr key={workspace.id}>
                <td><strong>{workspace.name}</strong></td>
                <td>{workspace.description || '-'}</td>
                <td>
                  {workspace.is_default && <span className="status-badge admin">Default</span>}
                </td>
                <td>
                  <button onClick={() => handleEdit(workspace)} className="btn-small">Edit</button>
                  {!workspace.is_default && (
                    <button onClick={() => handleDelete(workspace.id, workspace.is_default)} className="btn-small btn-danger">Delete</button>
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
              <h2>{currentWorkspace?.id ? 'Edit Workspace' : 'Add Workspace'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentWorkspace?.name}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  defaultValue={currentWorkspace?.description}
                  rows="4"
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
