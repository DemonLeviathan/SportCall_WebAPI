import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from '@mui/material';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', birthday: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('Отправка данных:', form);
      await authService.register(form);
      console.log('Регистрация прошла успешно!');
      navigate('/login');
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError(err.response?.data || 'Произошла ошибка');
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
          Регистрация
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
            label="День рождения"
            name="birthday"
            type="date"
            value={form.birthday}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            Зарегистрироваться
          </Button>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Register;
