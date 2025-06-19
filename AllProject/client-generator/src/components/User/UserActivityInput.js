import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Modal,
  FormControl,
  TextField,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import api from '../../services/api';

const UserActivityInput = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stepQuantity, setStepQuantity] = useState('');
  const [otherActivityTime, setOtherActivityTime] = useState('');
  const [editActivityId, setEditActivityId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchUserActivities = async () => {
    try {
      const userId = await getCurrentUserId();
      const response = await api.get(`/activity/user-daily-activities/${userId}`);
      setActivities(response.data);
    } catch (err) {
      console.error('Ошибка загрузки данных активности:', err.response?.data || err.message);
      setError('Не удалось загрузить данные активности.');
    }
  };

  const handleAddActivity = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Не удалось определить ID пользователя.');

      const payload = {
        stepQuantity: parseInt(stepQuantity, 10),
        otherActivityTime: parseFloat(otherActivityTime),
        userId: userId,
      };

      await api.post('/activity/add-daily-activity', payload);

      setSuccess('Активность успешно добавлена.');
      fetchUserActivities();
      handleCloseAddModal();
    } catch (err) {
      console.error('Ошибка добавления активности:', err.response?.data || err.message);
      setError(err.response?.data?.title || 'Не удалось добавить активность.');
    }
  };

  const handleUpdateActivity = async () => {
    try {
      const payload = {
        stepQuantity: parseInt(stepQuantity, 10),
        otherActivityTime: parseFloat(otherActivityTime),
        userId: await getCurrentUserId(),
      };

      await api.put(`/activity/update-daily-activity/${editActivityId}`, payload);

      setSuccess('Активность успешно обновлена.');
      fetchUserActivities();
      handleCloseEditModal();
    } catch (err) {
      console.error('Ошибка обновления активности:', err.response?.data || err.message);
      setError(err.response?.data?.title || 'Не удалось обновить активность.');
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setStepQuantity('');
    setOtherActivityTime('');
    setError('');
    setSuccess('');
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setError('');
    setSuccess('');
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setStepQuantity('');
    setOtherActivityTime('');
    setEditActivityId(null);
    setError('');
    setSuccess('');
  };

  const getCurrentUserId = async () => {
    const username = localStorage.getItem('currentUser');
    if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');

    const response = await api.get('/user/get-id', { params: { username } });
    return response.data.user_id;
  };

  return (
    <Box>
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="contained" onClick={() => setIsAddModalOpen(true)}>
          Ввести активность за сегодня
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setIsViewModalOpen(true);
            fetchUserActivities();
          }}
        >
          Просмотреть свою активность
        </Button>
      </Box>

      {/* Модальное окно для добавления активности */}
      <Modal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        aria-labelledby="add-daily-activity-modal"
        aria-describedby="add-daily-activity-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="add-daily-activity-modal" variant="h6" component="h2">
            Ввести активность за сегодня
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              label="Количество шагов"
              type="number"
              value={stepQuantity}
              onChange={(e) => setStepQuantity(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              label="Время прочей активности (в минутах)"
              type="number"
              value={otherActivityTime}
              onChange={(e) => setOtherActivityTime(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCloseAddModal}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleAddActivity}>
              Сохранить
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Модальное окно для просмотра активности */}
      <Modal
        open={isViewModalOpen}
        onClose={handleCloseViewModal}
        aria-labelledby="view-daily-activity-modal"
        aria-describedby="view-daily-activity-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxHeight: '80%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflow: 'auto',
          }}
        >
          <Typography id="view-daily-activity-modal" variant="h6" component="h2">
            Моя активность
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Количество шагов</TableCell>
                  <TableCell>Прочая активность (мин)</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow key={activity.dailyAcivityId}>
                      <TableCell>{activity.stepQuantity}</TableCell>
                      <TableCell>{activity.otherActivityTime || '—'}</TableCell>
                      <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          onClick={() => {
                            setEditActivityId(activity.dailyAcivityId);
                            setStepQuantity(activity.stepQuantity);
                            setOtherActivityTime(activity.otherActivityTime || '');
                            setIsEditModalOpen(true);
                          }}
                        >
                          Обновить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Нет данных о активности.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCloseViewModal}>
              Закрыть
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Модальное окно для обновления активности */}
      <Modal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        aria-labelledby="edit-daily-activity-modal"
        aria-describedby="edit-daily-activity-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="edit-daily-activity-modal" variant="h6" component="h2">
            Обновить активность
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              label="Количество шагов"
              type="number"
              value={stepQuantity}
              onChange={(e) => setStepQuantity(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              label="Время прочей активности (в минутах)"
              type="number"
              value={otherActivityTime}
              onChange={(e) => setOtherActivityTime(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCloseEditModal}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleUpdateActivity}>
              Сохранить
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default UserActivityInput;
