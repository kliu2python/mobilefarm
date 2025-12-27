import React, { useEffect, useState } from 'react';
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
}) {
  const { request } = useApi();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [body, setBody] = useState('{}');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteId, setDeleteId] = useState('');

  useEffect(() => {
    if (!listPath) return;
    request(listPath)
      .then((data) => setItems(Array.isArray(data) ? data : data?.devices || data?.providers || data?.users || []))
      .catch((err) => setError(err.message));
  }, [listPath, refreshKey, request]);

  const submit = async (path, method) => {
    setError(null);
    try {
      await request(path, { method, body });
      setRefreshKey((x) => x + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!deletePath || !deleteId) return;
    setError(null);
    try {
      await request(`${deletePath}/${deleteId}`, { method: 'DELETE' });
      setRefreshKey((x) => x + 1);
      setDeleteId('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <h3>{title}</h3>
          <p>Interact with the {title.toLowerCase()} endpoints.</p>
        </div>
        <button className="secondary" onClick={() => setRefreshKey((x) => x + 1)}>
          Refresh
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="section-grid">
        <div className="card">
          <h4>Current data</h4>
          {items.length === 0 ? <p>No records yet.</p> : <pre className="code-block">{JSON.stringify(items, null, 2)}</pre>}
        </div>
        <div className="card">
          <h4>Create or update</h4>
          <p>Submit raw JSON to the backend APIs.</p>
          <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex">
            {createPath && <button onClick={() => submit(createPath, createMethod)}>Create</button>}
            {updatePath && (
              <button className="secondary" onClick={() => submit(updatePath, updateMethod)}>
                Update
              </button>
            )}
          </div>
        </div>
        {deletePath && (
          <div className="card">
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
