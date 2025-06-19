import React, { createContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(() => {
    const token = localStorage.getItem('token');
    console.log('Токен из localStorage:', token);
    if (token) {
      try {
        const decodedUser = jwt_decode(token);
        const now = Math.floor(Date.now() / 1000); 
        console.log('Декодированный токен:', decodedUser);

        if (decodedUser.exp < now) {
          console.warn('Токен истёк.');
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentUserRole');
          return { token: null, user: null };
        }

        const role = decodedUser['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (!role) {
          console.error('Роль отсутствует в токене.');
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentUserRole');
          return { token: null, user: null };
        }

        localStorage.setItem('currentUser', decodedUser.sub); 
        localStorage.setItem('currentUserRole', role); 
        return { token, user: { ...decodedUser, role } };
      } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserRole');
        return { token: null, user: null };
      }
    }
    return { token: null, user: null };
  });

  useEffect(() => {
    if (authData.token) {
      console.log('Сохранение токена в localStorage.');
      localStorage.setItem('token', authData.token);
    } else {
      console.log('Удаление токена и данных пользователя из localStorage.');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserRole');
    }
  }, [authData]);

  const logout = () => {
    console.log('Выход пользователя.');
    setAuthData({ token: null, user: null });
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserRole');
  };

  return (
    <AuthContext.Provider value={{ ...authData, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
