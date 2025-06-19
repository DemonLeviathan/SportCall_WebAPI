import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
  TextField,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

const statusMap = {
  'Не выполнено': { label: 'Не выполнено', color: 'error.main', bgcolor: 'error.light' },
  'Выполнено': { label: 'Выполнено', color: 'success.main', bgcolor: 'success.light' },
};

const toPascalCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toPascalCase);
  return Object.keys(obj).reduce((acc, key) => {
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    acc[pascalKey] = toPascalCase(obj[key]);
    return acc;
  }, {});
};

const GoalSteps = ({ goalId }) => {
  const [steps, setSteps] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStep, setNewStep] = useState({ StepName: '', StepDescription: '', Status: 'Не выполнено' });
  const [editStep, setEditStep] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSteps();
  }, [goalId]);

  const fetchSteps = async () => {
    try {
      console.log('Запрос шагов для goalId:', goalId);
      const response = await api.get('/Steps', { params: { goalId } });
      const data = toPascalCase(response.data || []);
      console.log('Ответ сервера (GET):', data);
      setSteps(data);
    } catch (err) {
      console.error('Ошибка загрузки шагов:', err.response?.data || err.message);
      setError('Не удалось загрузить шаги.');
    }
  };

  const handleAddStep = async () => {
    if (!newStep.StepName.trim()) {
      setError('Название шага обязательно.');
      return;
    }
    if (!['Не выполнено', 'Выполнено'].includes(newStep.Status)) {
      setError('Неверный статус шага.');
      return;
    }

    try {
      const payload = {
        StepName: newStep.StepName,
        StepDescription: newStep.StepDescription,
        GoalId: goalId,
        Status: newStep.Status,
      };
      console.log('Отправка шага:', payload);
      const response = await api.post('/Steps', payload);
      const newStepData = toPascalCase(response.data);
      console.log('Ответ сервера (POST):', newStepData);
      setSuccess('Шаг добавлен.');
      setNewStep({ StepName: '', StepDescription: '', Status: 'Не выполнено' });
      setIsAddModalOpen(false);
      setError('');
      fetchSteps(); 
    } catch (err) {
      console.error('Ошибка добавления:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Ошибка добавления шага.';
      setError(errorMessage);
    }
  };

  const handleEditStep = async () => {
    if (!editStep.StepName.trim()) {
      setError('Название шага обязательно.');
      return;
    }
    if (!['Не выполнено', 'Выполнено'].includes(editStep.Status)) {
      setError('Неверный статус шага.');
      return;
    }

    try {
      const payload = {
        StepId: editStep.StepId,
        StepName: editStep.StepName,
        StepDescription: editStep.StepDescription,
        GoalId: goalId,
        Status: editStep.Status,
      };
      console.log('Обновление шага:', payload);
      await api.put(`/Steps/${editStep.StepId}`, payload);
      setSuccess('Шаг обновлён.');
      setIsEditModalOpen(false);
      setEditStep(null);
      setError('');
      fetchSteps(); 
    } catch (err) {
      console.error('Ошибка обновления:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Ошибка обновления шага.';
      setError(errorMessage);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!stepId) {
      setError('ID шага не определён.');
      console.error('Ошибка удаления: stepId is undefined');
      return;
    }
    try {
      console.log('Удаление шага ID:', stepId);
      await api.delete(`/Steps/${stepId}`);
      setSuccess('Шаг удалён.');
      fetchSteps(); 
    } catch (err) {
      console.error('Ошибка удаления:', err.response?.data || err.message);
      const errorMessage = err.response?.status === 401
        ? 'Не авторизован. Проверьте токен.'
        : err.response?.status === 404
        ? 'Шаг не найден.'
        : 'Ошибка удаления шага: ' + (err.response?.data?.title || err.message);
      setError(errorMessage);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Шаги к цели</Typography>
        <Button
          variant="contained"
          onClick={() => setIsAddModalOpen(true)}
          sx={{ bgcolor: 'primary.main' }}
        >
          Добавить шаг
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название шага</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {steps.length > 0 ? (
              steps.map((step) => (
                <TableRow key={step.StepId}>
                  <TableCell>{step.StepName || 'Без названия'}</TableCell>
                  <TableCell>{step.StepDescription || 'Нет описания'}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusMap[step.Status]?.label || step.Status || 'Неизвестно'}
                      sx={{
                        fontWeight: 'bold',
                        color: statusMap[step.Status]?.color || 'text.primary',
                        bgcolor: statusMap[step.Status]?.bgcolor || 'grey.100',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        console.log('Редактирование шага:', step);
                        setEditStep(step);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteStep(step.StepId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body1">Нет шагов для этой цели</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        aria-labelledby="add-step-modal"
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
          <Typography id="add-step-modal" variant="h6" component="h2" gutterBottom>
            Добавить шаг
          </Typography>
          <TextField
            label="Название шага"
            value={newStep.StepName}
            onChange={(e) => setNewStep({ ...newStep, StepName: e.target.value })}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Описание шага"
            value={newStep.StepDescription}
            onChange={(e) => setNewStep({ ...newStep, StepDescription: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="add-step-status-label">Статус</InputLabel>
            <Select
              labelId="add-step-status-label"
              value={newStep.Status}
              label="Статус"
              onChange={(e) => setNewStep({ ...newStep, Status: e.target.value })}
            >
              <MenuItem value="Не выполнено">Не выполнено</MenuItem>
              <MenuItem value="Выполнено">Выполнено</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setIsAddModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleAddStep}
            >
              Добавить
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        aria-labelledby="edit-step-modal"
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
          <Typography id="edit-step-modal" variant="h6" component="h2" gutterBottom>
            Редактировать шаг
          </Typography>
          <TextField
            label="Название шага"
            value={editStep?.StepName || ''}
            onChange={(e) => setEditStep({ ...editStep, StepName: e.target.value })}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Описание шага"
            value={editStep?.StepDescription || ''}
            onChange={(e) => setEditStep({ ...editStep, StepDescription: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="edit-step-status-label">Статус</InputLabel>
            <Select
              labelId="edit-step-status-label"
              value={editStep?.Status || ''}
              label="Статус"
              onChange={(e) => setEditStep({ ...editStep, Status: e.target.value })}
            >
              <MenuItem value="Не выполнено">Не выполнено</MenuItem>
              <MenuItem value="Выполнено">Выполнено</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setIsEditModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleEditStep}
            >
              Сохранить
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default GoalSteps;