// src/services/authService.js
import api from './api';

const register = async (userData) => {
  try {
    console.log('Отправляем данные на сервер:', userData);
    const response = await api.post('/account/register', userData);
    console.log('Ответ сервера:', response.data);
    return response;
  } catch (error) {
    console.error('Ошибка сервера:', error.response?.data || error.message);
    throw error;
  }
};


const login = async (userData) => {
  try {
    console.log('Отправляем данные на сервер:', userData);
    const response = await api.post('/account/login', userData);
    console.log('Ответ сервера:', response.data);
    return response;
  } catch (error) {
    console.error('Ошибка сервера:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  register,
  login,
};
