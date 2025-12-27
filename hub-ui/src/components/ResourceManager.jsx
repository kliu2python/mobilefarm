import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function ResourceManager({
  title,
  listPath,
  createPath,
  createMethod = 'POST',
  updatePath,
  updateMethod = 'POST',
  deletePath,
  identifierLabel = 'id',
  previewKeys = [],
}) {
  const { request } = useApi();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [body, setBody] = useState('{}');
  const [deleteId, setDeleteId] = useState('');

  const load = async () => {
    setError(null);
    try {
      const data = await request(listPath);
      const normalized = Array.isArray(data)
        ? data
        : data?.devices || data?.providers || data?.users || data?.workspaces || [];
      setItems(normalized);
      if (normalized.length > 0) {
        setBody(JSON.stringify(normalized[0], null, 2));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (listPath) {
      load();
    }
  }, [listPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (path, method) => {
    setError(null);
    try {
      await request(path, { method, body });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!deletePath || !deleteId) return;
    setError(null);
    try {
      await request(`${deletePath}/${deleteId}`, { method: 'DELETE' });
      setDeleteId('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = useMemo(() => (previewKeys.length ? previewKeys : ['id', 'name', identifierLabel]), [previewKeys, identifierLabel]);

  return (
    <div className="resource-card">
      <div className="page-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>Manage {title.toLowerCase()}</h2>
          <p className="muted">Send payloads to the backend while seeing a structured preview.</p>
        </div>
        <div className="resource-actions">
          <button className="ghost" onClick={load}>
            Refresh
          </button>
          <button className="ghost" onClick={() => setBody(JSON.stringify(items[0] || {}, null, 2))}>
            Prefill from first record
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="resource-grid">
        <div className="resource-body">
          <h4>Current {title}</h4>
          {items.length === 0 ? (
            <p className="muted">No records yet.</p>
          ) : (
            <div className="resource-json">
              {previewKeys.length ? (
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        {columns.map((col) => (
                          <td key={col}>{item[col] || item[col.toUpperCase()] || item[col.toLowerCase()] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre>{JSON.stringify(items, null, 2)}</pre>
              )}
            </div>
          )}
        </div>

        <div className="resource-body">
          <h4>Create or update</h4>
          <p className="muted">Edit the JSON body and submit using the existing endpoints.</p>
          <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="resource-actions">
            {createPath && <button onClick={() => submit(createPath, createMethod)}>Create</button>}
            {updatePath && (
              <button className="secondary" onClick={() => submit(updatePath, updateMethod)}>
                Update
              </button>
            )}
          </div>
        </div>

        {deletePath && (
          <div className="resource-body">
            <h4>Delete</h4>
            <label htmlFor="deleteId">{identifierLabel}</label>
            <input
              id="deleteId"
              placeholder={`Enter ${identifierLabel}`}
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
            />
            <button className="secondary" onClick={remove}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
