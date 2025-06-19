// src/components/Layout/Navbar.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav>
      <ul>
        {!user && (
          <>
            <li><Link to="/login">Войти</Link></li>
            <li><Link to="/register">Регистрация</Link></li>
          </>
        )}
        {user && user.role === 'user' && (
          <>
            <li><Link to="/user">Панель Пользователя</Link></li>
            <li><button onClick={handleLogout}>Выйти</button></li>
          </>
        )}
        {user && user.role === 'admin' && (
          <>
            <li><Link to="/admin">Админ Панель</Link></li>
            <li><button onClick={handleLogout}>Выйти</button></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
