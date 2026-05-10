import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, mat_khau) => {
    const d = await authAPI.login({ email, mat_khau });
    localStorage.setItem('token', d.token);
    setUser(d.user);
    return d.user;
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
