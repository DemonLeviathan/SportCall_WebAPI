import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import jwt_decode from 'jwt-decode';

function Login() {
  const { setAuthData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authService.login(form);
      const token = response.data?.token;

      if (!token) {
        throw new Error('Токен отсутствует в ответе сервера');
      }

      const decodedUser = jwt_decode(token);
      const role = decodedUser['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (!role) {
        throw new Error('Роль отсутствует в токене');
      }

      setAuthData({ token, user: { ...decodedUser, role } });
      navigate(role === 'Admin' ? '/admin' : '/user');
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      setError('Неверный логин или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          p: 4,
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: 3,
          backgroundColor: '#fafafa',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Авторизация
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя пользователя"
            name="username"
            value={form.username}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            Войти
          </Button>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;