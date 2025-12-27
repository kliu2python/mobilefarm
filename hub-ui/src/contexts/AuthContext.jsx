import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedWorkspace = localStorage.getItem('selectedWorkspace');

    if (token && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && typeof userData === 'object') {
          setUser(userData);

          // Load user workspaces if regular user
          if (userData.role === 'user') {
            loadWorkspaces();
          }

          if (savedWorkspace && savedWorkspace !== 'undefined' && savedWorkspace !== 'null') {
            try {
              const workspace = JSON.parse(savedWorkspace);
              if (workspace && typeof workspace === 'object') {
                setSelectedWorkspace(workspace);
              }
            } catch (error) {
              console.error('Failed to parse workspace data:', error);
              localStorage.removeItem('selectedWorkspace');
            }
          }
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedWorkspace');
      }
    }
    setLoading(false);
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data);

      // Auto-select first workspace if none selected
      if (!selectedWorkspace && response.data.length > 0) {
        selectWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const selectWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/authenticate', { username, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Load workspaces for regular users
      if (userData.role === 'user') {
        await loadWorkspaces();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedWorkspace');
      setUser(null);
      setSelectedWorkspace(null);
      setWorkspaces([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        selectedWorkspace,
        setSelectedWorkspace: selectWorkspace,
        workspaces,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
