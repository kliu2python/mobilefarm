import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function FilesPage() {
  const { request } = useApi();
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setError(null);
    request('/admin/files')
      .then(setFiles)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selected);
      await request('/admin/upload-file', { method: 'POST', body: formData });
      setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <h3>Files</h3>
          <p>Upload resources and inspect the stored assets.</p>
        </div>
        <button className="secondary" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="card">
        <h4>Upload file</h4>
        <form onSubmit={upload}>
          <input
            type="file"
            onChange={(e) => setSelected(e.target.files?.[0] || null)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="card">
        <h4>Stored files</h4>
        {files.length === 0 ? (
          <p>No files available.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size (bytes)</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id || file.name}>
                  <td>{file.name}</td>
                  <td>{file.type}</td>
                  <td>{file.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
