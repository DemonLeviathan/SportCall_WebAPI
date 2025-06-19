import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import api from '../../services/api';

const statusMap = {
  completed: { label: 'Выполнено', color: 'black', bgcolor: 'success.light' },
  failed: { label: 'Не выполнено', color: 'black', bgcolor: 'error.light' },
  accepted: { label: 'Принято', color: 'black', bgcolor: 'info.light' },
  rejected: { label: 'Отклонено', color: 'black', bgcolor: 'warning.light' },
  pending: { label: 'Ожидает', color: 'black', bgcolor: 'grey.200' },
};

const CallList = () => {
  const [calls, setCalls] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedCallForChallenge, setSelectedCallForChallenge] = useState(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const callsPerPage = 4;

  const filteredCalls = filterStatus === 'all'
    ? calls
    : calls.filter((call) => call.status === filterStatus);

  const indexOfLastCall = currentPage * callsPerPage;
  const indexOfFirstCall = indexOfLastCall - callsPerPage;
  const currentCalls = filteredCalls.slice(indexOfFirstCall, indexOfLastCall);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const username = localStorage.getItem('currentUser');
        if (!username) throw new Error('Имя пользователя отсутствует.');

        const response = await api.get('/call/user-calls', { params: { username } });
        setCalls(response.data.calls || []);
      } catch (err) {
        console.error('Ошибка загрузки вызовов:', err);
        setError('Не удалось загрузить вызовы.');
      }
    };

    const fetchFriends = async () => {
      try {
        const username = localStorage.getItem('currentUser');
        if (!username) throw new Error('Имя пользователя отсутствует.');

        const userResponse = await api.get('/user/get-id', { params: { username } });
        const userId = userResponse.data.user_id;

        const response = await api.get('/friendship/list', { params: { userId } });
        setFriends(response.data.friends || []);
      } catch (err) {
        console.error('Ошибка загрузки друзей:', err.response?.data || err.message);
        setError('Не удалось загрузить список друзей.');
        setFriends([]);
      }
    };

    fetchCalls();
    fetchFriends();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');

      const response = await api.get('/user/get-id', { params: { username } });
      return response.data.user_id;
    } catch (err) {
      console.error('Ошибка получения ID текущего пользователя:', err);
      return null;
    }
  };

  const handleSendChallenge = async () => {
    try {
      if (!selectedFriendIds.length || !selectedCallForChallenge?.call_id) {
        setError('Выберите хотя бы одного друга и вызов.');
        return;
      }

      const currentUserId = await getCurrentUserId();
      if (!currentUserId) throw new Error('Не удалось определить ID пользователя.');

      const payload = {
        senderId: currentUserId,
        receiverIds: selectedFriendIds,
        callId: selectedCallForChallenge.call_id,
        callName: selectedCallForChallenge.call_name,
        description: selectedCallForChallenge.description,
      };

      console.log('Payload для отправки вызова:', payload);

      const response = await api.post('/challenge/send', payload);
      console.log('Вызовы успешно отправлены:', response.data);
      setSuccess('Вызовы успешно отправлены.');
      handleCloseChallengeModal();
    } catch (err) {
      console.error('Ошибка отправки вызова:', err.response?.data || err.message);
      setError(err.response?.data?.title || 'Не удалось отправить вызовы.');
    }
  };

  const handleCloseChallengeModal = () => {
    setSelectedFriendIds([]);
    setSelectedCallForChallenge(null);
    setIsChallengeModalOpen(false);
    setError('');
    setSuccess('');
  };

  const updateCallStatus = async (callId, newStatus) => {
    try {
      await api.post('/call/update-status', {
        callId,
        status: newStatus,
      });

      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.call_id === callId ? { ...call, status: newStatus } : call
        )
      );
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err.message || err);
      setError('Не удалось обновить статус вызова.');
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <Box>
      {success && <Alert severity="success">{success}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-status-label">Фильтр по статусу</InputLabel>
          <Select
            labelId="filter-status-label"
            id="filter-status"
            value={filterStatus}
            label="Фильтр по статусу"
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="completed">Выполнено</MenuItem>
            <MenuItem value="failed">Не выполнено</MenuItem>
            <MenuItem value="accepted">Принято</MenuItem> 
          </Select>
        </FormControl>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          mx: 'auto',
          width: '90%',
          maxWidth: '1200px',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentCalls.length > 0 ? (
              currentCalls.map((call) => (
                <TableRow key={call.call_id}>
                  <TableCell>{call.call_name}</TableCell>
                  <TableCell>{call.description}</TableCell>
                  <TableCell>{call.call_date || 'Не указано'}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusMap[call.status]?.label || call.status}
                      sx={{
                        fontWeight: 'bold',
                        color: statusMap[call.status]?.color || 'text.primary',
                        bgcolor: statusMap[call.status]?.bgcolor || 'grey.100',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button
                        variant="contained"
                        onClick={() => updateCallStatus(call.call_id, 'completed')}
                      >
                        Выполнено
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => updateCallStatus(call.call_id, 'failed')}
                      >
                        Не выполнено
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setSelectedCallForChallenge(call);
                          setIsChallengeModalOpen(true);
                        }}
                      >
                        Бросить вызов
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1">Нет вызовов для выбранного статуса</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(filteredCalls.length / callsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      <Modal
        open={isChallengeModalOpen}
        onClose={handleCloseChallengeModal}
        aria-labelledby="send-challenge-modal"
        aria-describedby="send-challenge-modal-description"
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
          <Typography id="send-challenge-modal" variant="h6" component="h2">
            Бросить вызов для вызова {selectedCallForChallenge?.call_name}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Выберите друзей:</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="select-friends-label">Друзья</InputLabel>
              <Select
                labelId="select-friends-label"
                id="select-friends"
                multiple
                value={selectedFriendIds}
                onChange={(e) => setSelectedFriendIds(e.target.value)}
                label="Друзья"
                renderValue={(selected) =>
                  selected
                    .map((id) => friends.find((f) => f.friendId === id)?.friendName || '')
                    .join(', ')
                }
              >
                {Array.isArray(friends) && friends.length > 0 ? (
                  friends.map((friend) => (
                    <MenuItem key={friend.friendId} value={friend.friendId}>
                      {friend.friendName}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    Нет доступных друзей
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCloseChallengeModal}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleSendChallenge}
            >
              Отправить
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default CallList;