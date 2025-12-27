import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hub_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hub_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('hub_token', token);
    } else {
      localStorage.removeItem('hub_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('hub_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hub_user');
    }
  }, [user]);

  const value = useMemo(
    () => ({ token, setToken, user, setUser, isAuthenticated: Boolean(token) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
