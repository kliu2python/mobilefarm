import { useCallback } from 'react';
import { useAuth } from './useAuth';

export function useApi() {
  const { token } = useAuth();

  const request = useCallback(
    async (path, options = {}) => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const response = await fetch(path, { ...options, headers });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const message = data?.error || response.statusText;
        throw new Error(message);
      }
      return data;
    },
    [token]
  );

  return { request };
}
