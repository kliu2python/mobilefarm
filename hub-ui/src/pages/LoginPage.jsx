import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const { request } = useApi();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await request('/authenticate', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(res.access_token);
      setUser({ username: res.username, role: res.role });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto' }} className="card">
      <h2>Hub login</h2>
      <p>Please authenticate to access the device farm.</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}
