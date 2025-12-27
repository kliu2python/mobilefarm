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
    <div className="content" style={{ minHeight: '100vh' }}>
      <div className="hero-card" style={{ maxWidth: 520, margin: '80px auto' }}>
        <p className="eyebrow">Welcome</p>
        <h2>Sign in to the hub</h2>
        <p className="muted">Authenticate to access devices, providers, and admin tooling.</p>
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
          <button type="submit" style={{ width: '100%' }}>
            Login
          </button>
        </form>
        {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
