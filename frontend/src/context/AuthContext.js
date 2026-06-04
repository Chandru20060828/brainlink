import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import i18n from '../utils/i18n';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/profile')
        .then(res => {
          setUser(res.data);
          // Restore saved language on load
          const savedLang = localStorage.getItem('appLanguage') || res.data.language || 'en';
          i18n.changeLanguage(savedLang);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      const savedLang = localStorage.getItem('appLanguage') || 'en';
      i18n.changeLanguage(savedLang);
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    const lang = userData.language || 'en';
    localStorage.setItem('appLanguage', lang);
    i18n.changeLanguage(lang);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      // Persist language change
      if (updates.language) {
        localStorage.setItem('appLanguage', updates.language);
        i18n.changeLanguage(updates.language);
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
