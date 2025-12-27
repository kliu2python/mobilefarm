import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="page">
      <PageHeader
        title="Files"
        subtitle="Upload application binaries or assets and keep an eye on what’s stored."
        actions={
          <button className="ghost" onClick={load}>
            Refresh
          </button>
        }
      />

      {error && <div className="alert">{error}</div>}

      <div className="section-grid">
        <div className="panel">
          <h4>Upload file</h4>
          <form onSubmit={upload}>
            <input type="file" onChange={(e) => setSelected(e.target.files?.[0] || null)} required />
            <button type="submit" disabled={loading}>
              {loading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </div>

        <div className="panel">
          <h4>Stored files</h4>
          {files.length === 0 ? (
            <p className="muted">No files available.</p>
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
    </div>
  );
}
