// src/components/ChallengeComponent.js
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import api from '../../services/api';

const ChallengeComponent = () => {
  const [receivedChallenges, setReceivedChallenges] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReceivedChallenges = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Не удалось определить текущего пользователя.');

      const response = await api.get('/challenge/received', { params: { userId } });
      setReceivedChallenges(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки полученных вызовов:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchReceivedChallenges();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');

      const response = await api.get('/user/get-id', { params: { username } });
      return response.data.user_id;
    } catch (err) {
      console.error('Ошибка получения ID текущего пользователя:', err);
      setError('Не удалось определить текущего пользователя.');
      return null;
    }
  };

  const handleRespondChallenge = async (challengeId, accept) => {
    try {
      const payload = {
        ChallengeId: challengeId,
        Accept: accept,
      };

      const response = await api.post('/challenge/respond', payload);
      setSuccess(accept ? 'Вызов принят.' : 'Вызов отклонён.');
      fetchReceivedChallenges();
    } catch (err) {
      console.error('Ошибка ответа на вызов:', err.response?.data || err.message);
      setError(err.response?.data || 'Не удалось ответить на вызов.');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Полученные Вызовы
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {receivedChallenges.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Отправитель</TableCell>
                <TableCell>Вызов</TableCell>
                <TableCell>Описание</TableCell>
                <TableCell>Дата отправки</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivedChallenges.map((challenge) => (
                <TableRow key={challenge.ChallengeId}>
                  <TableCell>{challenge.SenderName}</TableCell>
                  <TableCell>{challenge.CallName}</TableCell>
                  <TableCell>{challenge.CallDescription}</TableCell>
                  <TableCell>{new Date(challenge.SentAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleRespondChallenge(challenge.ChallengeId, true)}
                      sx={{ mr: 1 }}
                    >
                      Принять
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleRespondChallenge(challenge.ChallengeId, false)}
                    >
                      Отклонить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ mt: 2 }}>Нет полученных вызовов.</Typography>
      )}
    </Box>
  );
};

export default ChallengeComponent;
