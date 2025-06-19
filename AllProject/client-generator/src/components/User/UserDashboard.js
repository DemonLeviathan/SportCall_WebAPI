import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  TextField,
  AppBar,
  Toolbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../services/api';
import ChallengeComponent from './ChallengeComponent';
import CallList from './CallList';
import UserActivityInput from './UserActivityInput';
import UserGoals from './UserGoals';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [friendsPage, setFriendsPage] = useState(1);
  const [friendsTotalPages, setFriendsTotalPages] = useState(0);
  const [activityTypes, setActivityTypes] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [call, setCall] = useState(null);
  const [goals, setGoals] = useState([]);
  const [calls, setCalls] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [newUserData, setNewUserData] = useState({
    activity_name: '',
    activity_type: '',
    weight: '',
    height: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFriendshipId, setSelectedFriendshipId] = useState(null);

  // Статистика
  const [userStats, setUserStats] = useState({
    username: '',
    monthlyCompleted: 0,
    yearlyCompleted: 0,
    categoriesStats: [],
  });
  const [comparisonStats, setComparisonStats] = useState(null);
  const [statsView, setStatsView] = useState('personal'); // 'personal' или 'global'

  const addGoal = (name) => {
    const newGoal = { id: Date.now(), name, description: '' };
    setGoals([...goals, newGoal]);
  };

  const addStep = (goalId, step) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId
          ? { ...goal, steps: [...(goal.steps || []), step] }
          : goal
      )
    );
  };

  const getCurrentUserId = useCallback(async () => {
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
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const [friendNotifications, challengeNotifications] = await Promise.all([
        api.get('/friendship/notifications', { params: { userId } }),
        api.get('/Challenge/notifications', { params: { userId } }),
      ]);
      const combinedNotifications = [
        ...friendNotifications.data.map((f) => ({ type: 'friendRequest', ...f })),
        ...challengeNotifications.data.map((c) => ({ type: 'challenge', ...c })),
      ];
      setNotifications(combinedNotifications);
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err.response?.data || err.message);
      setError('Не удалось загрузить уведомления.');
    }
  }, [getCurrentUserId]);

  const fetchFriends = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('ID пользователя отсутствует.');
      const response = await api.get('/friendship/list', {
        params: {
          userId,
          page: friendsPage,
          size: pageSize,
        },
      });
      setFriends(response.data.friends || []);
      setFriendsTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('Ошибка загрузки друзей:', err.response?.data || err.message);
      setError('У вас нет друзей.');
    }
  }, [getCurrentUserId, friendsPage, pageSize]);

  const fetchUsers = useCallback(async () => {
    try {
      const currentUserId = localStorage.getItem('currentUser');
      const currentUserRole = localStorage.getItem('currentUserRole');
      if (!currentUserId || !currentUserRole) {
        setError('Текущий пользователь не определён.');
        return;
      }
      const response = await api.get('/user/users', { params: { searchTerm } });
      const filteredUsers = response.data.users.filter((user) => {
        return user.username !== currentUserId && user.user_role !== 'Admin';
      });
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError('Не удалось загрузить пользователей.');
    }
  }, [searchTerm]);

  const fetchUserData = useCallback(async () => {
    try {
      const username = localStorage.getItem('currentUser');
      const response = await api.get(`/userdata/all`, {
        params: { username: username, page: currentPage, size: pageSize },
      });
      const { records, totalPages } = response.data;
      const sortedRecords = [...records].sort((a, b) => new Date(b.date_info) - new Date(a.date_info));
      setUserData(sortedRecords);
      setTotalPages(totalPages);
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
      setError('Не удалось загрузить данные пользователя.');
    }
  }, [currentPage, pageSize]);

  const fetchActivityTypes = useCallback(async () => {
    try {
      const response = await api.get('/activity/types');
      setActivityTypes(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки типов активностей:', err);
      setError('Не удалось загрузить типы активностей.');
    }
  }, []);

  const fetchActivitiesByType = useCallback(async (type) => {
    try {
      if (!type) {
        setFilteredActivities([]);
        return;
      }
      const response = await api.get('/activity/by-type', { params: { activityType: type } });
      setFilteredActivities(response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки активностей по типу:', err);
      setError('Не удалось загрузить список активностей.');
    }
  }, []);

  const fetchCallsNames = async () => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Нет имени пользователя в localStorage.');
      const response = await api.get('/call/user-calls-name', { params: { username } });
      const callData = response.data.calls;
      const callsWithId = callData.map((call) => ({
        ...call,
      }));
      setCalls(callsWithId);
      setTotalPages(
        callsWithId.length > 0 ? Math.ceil(callsWithId.length / pageSize) : 1
      );
    } catch (error) {
      console.error('Ошибка при загрузке вызовов:', error);
      setError('Не удалось загрузить список вызовов.');
    }
  };

  const fetchUserStats = async () => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует.');
      const response = await api.get('/stats/user', {
        params: { username },
      });
      setUserStats({
        username,
        monthlyCompleted: response.data.monthlyCompleted || 0,
        yearlyCompleted: response.data.yearlyCompleted || 0,
        categoriesStats: response.data.categoriesStats || [],
      });
    } catch (err) {
      console.error('Ошибка загрузки статистики пользователя:', err);
      setError('Не удалось загрузить персональную статистику.');
    }
  };

  const fetchComparisonStats = async () => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует.');
      const response = await api.get('/stats/comparison', {
        params: { username },
      });
      console.log('Comparison stats:', response.data); 
      setComparisonStats(response.data);
    } catch (err) {
      console.error('Ошибка загрузки сравнительной статистики:', err.response?.data || err.message);
      setError('Не удалось загрузить сравнительную статистику.');
      setComparisonStats(null);
    }
  };

  const handleAddUserData = async () => {
    try {
      if (!newUserData.activity_name || !newUserData.activity_type) {
        setError('Название и тип активности обязательны.');
        return;
      }
      const userId = await getCurrentUserId();
      if (!userId) {
        setError('Не удалось определить ID пользователя.');
        return;
      }
      await api.post('/userData', {
        ...newUserData,
        user_id: userId,
      });
      setSuccess('Данные успешно добавлены!');
      setTimeout(() => setSuccess(''), 3000);
      setNewUserData({ activity_name: '', activity_type: '', weight: '', height: '' });
      fetchUserData();
    } catch (err) {
      console.error('Ошибка добавления данных пользователя:', err);
      setError('Не удалось добавить данные пользователя.');
    }
  };

  const handleAddFriend = async (id) => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');
      const userResponse = await api.get('/user/get-id', { params: { username } });
      const userId = userResponse.data.user_id;
      const payload = {
        user1_id: userId,
        user2_id: id,
      };
      const response = await api.post('/friendship/add', payload);
      setSuccess('Запрос отправлен!');
      setTimeout(() => setSuccess(''), 3000);
      fetchNotifications();
    } catch (err) {
      console.error('Ошибка добавления в друзья:', err.response?.data || err.message);
      setError('Не удалось отправить запрос.');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await api.delete(`/friendship/delete/${selectedFriendshipId}`);
      setSuccess('Друг успешно удалён!');
      setTimeout(() => setSuccess(''), 3000);
      setOpenDialog(false);
      setSelectedFriendshipId(null);
      fetchFriends();
    } catch (err) {
      console.error('Ошибка удаления друга:', err.response?.data || err.message);
      setError(err.response?.data || 'Не удалось удалить друга.');
      setOpenDialog(false);
    }
  };

  const handleRespondNotification = async (
    notificationId,
    recieverName,
    recieverId,
    senderId,
    senderName,
    accept
  ) => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');
      const payload = {
        friend_id: notificationId,
        user1_id: senderId,
        user2_id: recieverId,
        IsPending: !accept,
      };
      const response = await api.post(`/friendship/respond`, payload, { params: { accept } });
      setSuccess('Запрос обработан успешно!');
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.friend_id !== notificationId)
      );
      fetchFriends();
    } catch (err) {
      console.error('Ошибка обработки уведомления:', err.response?.data || err.message);
      setError('Не удалось обработать запрос.');
    }
  };

  const handleAcceptChallenge = async (challengeId) => {
    try {
      await api.post('/challenge/respond', { ChallengeId: challengeId, Accept: true });
      setNotifications((prev) =>
        prev.filter((notification) => notification.challengeId !== challengeId)
      );
    } catch (err) {
      console.error('Ошибка при принятии вызова:', err.response?.data || err.message);
      setError('Не удалось обработать запрос.');
    }
  };

  const handleRejectChallenge = async (challengeId) => {
    try {
      await api.post('/challenge/respond', { ChallengeId: challengeId, Accept: false });
      setNotifications((prev) =>
        prev.filter((notification) => notification.challengeId !== challengeId)
      );
    } catch (err) {
      console.error('Ошибка при отклонении вызова:', err.response?.data || err.message);
      setError('Не удалось обработать запрос.');
    }
  };

  const getCall = async (frequency) => {
    try {
      const username = localStorage.getItem('currentUser');
      if (!username) throw new Error('Имя пользователя отсутствует в localStorage.');
      const response = await api.post(`/call/generate/${frequency}`, null, {
        params: { username },
      });
      setCall(response.data);
      setSnackbar({ open: true, message: 'Вызов успешно получен!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка получения вызова:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Не удалось получить вызов.', severity: 'error' });
    }
  };

  const handleCallResponse = async (accept) => {
    try {
      if (!call) throw new Error('Нет вызова для обработки.');
      const newStatus = accept ? 'accepted' : 'rejected';
      const response = await api.post('/call/update-status', {
        callId: call.call_id,
        status: newStatus,
      });
      setSnackbar({
        open: true,
        message: `Вызов ${accept ? 'принят' : 'отклонён'}`,
        severity: 'success',
      });
      setCall(null);
    } catch (error) {
      console.error('Ошибка обработки вызова:', error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: 'Не удалось обработать вызов.',
        severity: 'error',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('account/logout');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      console.error('Ошибка выхода:', err.response?.data || err.message);
      setError('Не удалось выйти из системы.');
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUserStats();
    fetchComparisonStats();
  }, [fetchNotifications]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchActivityTypes();
    } else {
      console.error('Текущий пользователь не определён.');
      setError('Текущий пользователь не определён.');
    }
  }, [user, fetchFriends, fetchActivityTypes]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchCallsNames();
  }, []);

  // Данные для графика персональной статистики
  const userStatsChartData = {
    labels: userStats.categoriesStats.map((cat) => cat.category),
    datasets: [
      {
        label: 'Ежемесячные вызовы',
        data: userStats.categoriesStats.map((cat) => cat.monthlyCompleted),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Ежегодные вызовы',
        data: userStats.categoriesStats.map((cat) => cat.yearlyCompleted),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Данные для графика глобальной статистики
  const globalComparisonChartData = {
    labels: ['Ваши вызовы', 'Среднее по возрастной категории', 'Среднее по всем'],
    datasets: [
      {
        label: 'Вызовы за месяц',
        data: [
          comparisonStats?.userMonthlyCompleted || 0,
          comparisonStats?.ageGroupAverageMonthly || 0,
          comparisonStats?.allAverageMonthly || 0,
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  if (!user) {
    return (
      <Typography variant="h6">
        Текущий пользователь не определён. Пожалуйста, войдите в систему.
      </Typography>
    );
  }

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: '#B8860B' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Добро пожаловать, {localStorage.getItem('currentUser')}!
          </Typography>
          <Button color="inherit" onClick={() => scrollToSection('challenges')}>
            Вызовы
          </Button>
          <Button color="inherit" onClick={() => scrollToSection('goals')}>
            Цели
          </Button>
          <Button color="inherit" onClick={() => scrollToSection('user-data')}>
            Данные
          </Button>
          <Button color="inherit" onClick={() => scrollToSection('statistics')}>
            Статистика
          </Button>
          <Button color="inherit" onClick={() => scrollToSection('friends')}>
            Друзья
          </Button>
          <Button color="inherit" onClick={() => scrollToSection('notifications')}>
            Уведомления
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Выйти
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 10 }}>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box id="challenges" sx={{ mb: 4 }}>
          {!call ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              {['daily', 'weekly', 'monthly'].map((type) => (
                <Paper
                  key={type}
                  sx={{
                    width: 300,
                    textAlign: 'center',
                    padding: 2,
                    boxShadow: 3,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s',
                    },
                  }}
                >
                  <Typography variant="h6">
                    {type === 'daily' && 'Ежедневный вызов'}
                    {type === 'weekly' && 'Еженедельный вызов'}
                    {type === 'monthly' && 'Ежемесячный вызов'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {type === 'daily' && 'Нажмите, чтобы получить ежедневное задание.'}
                    {type === 'weekly' && 'Нажмите, чтобы получить вызов на неделю.'}
                    {type === 'monthly' && 'Нажмите, чтобы получить вызов на месяц.'}
                  </Typography>
                  <Button variant="contained" onClick={() => getCall(type)} sx={{ mt: 2 }}>
                    Получить вызов
                  </Button>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper sx={{ maxWidth: 600, margin: '0 auto', padding: 2, boxShadow: 3 }}>
              <Typography variant="h6">{call.call_name}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {call.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="contained" onClick={() => handleCallResponse(true)} sx={{ m: 1 }}>
                  Принять
                </Button>
                <Button variant="outlined" onClick={() => handleCallResponse(false)} sx={{ m: 1 }}>
                  Заменить
                </Button>
              </Box>
            </Paper>
          )}
          <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />
        </Box>

        <Box sx={{ p: 2, mb: 4 }}>
          <CallList calls={calls} />
          <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />
        </Box>

        <Box id="goals">
          <UserGoals />
          <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />
        </Box>

        <Box id="user-data" sx={{ mb: 4 }}>
          <Typography variant="h6">Добавить данные пользователя</Typography>
          <Box>
            <UserActivityInput />
          </Box>
          <TextField
            select
            label={newUserData.activity_type ? "Тип активности" : ""}
            value={newUserData.activity_type}
            onChange={(e) => {
              const selectedType = e.target.value;
              setNewUserData({ ...newUserData, activity_type: selectedType });
              fetchActivitiesByType(selectedType);
            }}
            onFocus={() => setNewUserData({ ...newUserData, activity_type: newUserData.activity_type || " " })}
            onBlur={() => {
              if (!newUserData.activity_type) setNewUserData({ ...newUserData, activity_type: '' });
            }}
            fullWidth
            margin="normal"
            variant="outlined"
            slotProps={{
              inputLabel: {
                shrink: !!newUserData.activity_type,
              },
            }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Выберите тип активности</option>
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </TextField>
          <TextField
            select
            label={newUserData.activity_name ? "Название активности" : ""}
            value={newUserData.activity_name}
            onChange={(e) => setNewUserData({ ...newUserData, activity_name: e.target.value })}
            onFocus={() => setNewUserData({ ...newUserData, activity_name: newUserData.activity_name || " " })}
            onBlur={() => {
              if (!newUserData.activity_name) setNewUserData({ ...newUserData, activity_name: '' });
            }}
            fullWidth
            margin="normal"
            variant="outlined"
            slotProps={{
              inputLabel: {
                shrink: !!newUserData.activity_name,
              },
            }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Выберите активность</option>
            {filteredActivities.map((activity) => (
              <option key={activity.activity_name} value={activity.activity_name}>
                {activity.activity_name}
              </option>
            ))}
          </TextField>
          <TextField
            label="Вес (кг)"
            value={newUserData.weight}
            onChange={(e) => setNewUserData({ ...newUserData, weight: e.target.value })}
            type="number"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Рост (см)"
            value={newUserData.height}
            onChange={(e) => setNewUserData({ ...newUserData, height: e.target.value })}
            type="number"
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleAddUserData} sx={{ mt: 2 }}>
            Добавить
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6">Ваши данные</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Тип активности</TableCell>
                  <TableCell>Название активности</TableCell>
                  <TableCell>Вес (кг)</TableCell>
                  <TableCell>Рост (см)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userData.map((data, index) => (
                  <TableRow
                    key={data.data_id}
                    sx={{
                      backgroundColor: index === 0 ? '#f0f8ff' : 'inherit',
                    }}
                  >
                    <TableCell>{new Date(data.date_info).toLocaleDateString()}</TableCell>
                    <TableCell>{data.activityType || 'Нет данных'}</TableCell>
                    <TableCell>{data.activityName || 'Нет данных'}</TableCell>
                    <TableCell>{data.weight}</TableCell>
                    <TableCell>{data.height}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              sx={{ mr: 1 }}
            >
              Назад
            </Button>
            <Typography variant="body1" sx={{ alignSelf: 'center' }}>
              Страница {currentPage} из {totalPages}
            </Typography>
            <Button
              variant="contained"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              sx={{ ml: 1 }}
            >
              Вперёд
            </Button>
          </Box>
          <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />
        </Box>

        <Box id="statistics" sx={{ mb: 4 }}>
          <Typography variant="h5">Статистика</Typography>
          <ToggleButtonGroup
            color="primary"
            value={statsView}
            exclusive
            onChange={(e, newView) => {
              if (newView) setStatsView(newView);
            }}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="personal">Личная</ToggleButton>
            <ToggleButton value="global">Глобальная</ToggleButton>
          </ToggleButtonGroup>

          {statsView === 'personal' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mt: 2,
                maxWidth: 1000,
                backgroundColor: '#f5f5f5',
                p: 3,
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography>
                  <strong>Выполнено за месяц:</strong> {userStats.monthlyCompleted}
                </Typography>
                <Typography>
                  <strong>Выполнено за год:</strong> {userStats.yearlyCompleted}
                </Typography>
              </Box>

              {userStats.categoriesStats.length > 0 ? (
                <Box sx={{ maxWidth: 600 }}>
                  <Bar
                    data={userStatsChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Статистика по категориям' },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Typography>Нет данных для отображения графика.</Typography>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Статистика по категориям:</Typography>
                {userStats.categoriesStats.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Категория</TableCell>
                          <TableCell align="center">Выполнено за месяц</TableCell>
                          <TableCell align="center">Выполнено за год</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.categoriesStats.map((cat, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{cat.category}</TableCell>
                            <TableCell align="center">{cat.monthlyCompleted}</TableCell>
                            <TableCell align="center">{cat.yearlyCompleted}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography sx={{ mt: 1 }}>Нет данных по категориям.</Typography>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={fetchUserStats}>
                  Обновить статистику
                </Button>
              </Box>
            </Box>
          )}

          {statsView === 'global' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mt: 2,
                maxWidth: 1000,
                backgroundColor: '#f5f5f5',
                p: 3,
                borderRadius: 2,
              }}
            >
              <Box>
                {comparisonStats && (
                  <Typography>
                    Возрастная категория: {comparisonStats.ageGroupStart}-{comparisonStats.ageGroupEnd} лет
                  </Typography>
                )}
                {!comparisonStats && <Typography>Данные не загружены</Typography>}
              </Box>

              {comparisonStats && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Сравнение вызовов за месяц</Typography>
                  <Box sx={{ maxWidth: 600 }}>
                    <Bar
                      data={globalComparisonChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: true, text: 'Ваши вызовы vs Средние значения' },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { callback: (value) => `${value}` },
                          },
                        },
                      }}
                    />
                  </Box>
                  <Typography sx={{ mt: 1 }}>
                    Ваши вызовы: {comparisonStats.userMonthlyCompleted}
                  </Typography>
                  <Typography>
                    Среднее по возрастной категории: {comparisonStats.ageGroupAverageMonthly}
                  </Typography>
                  <Typography>
                    Среднее по всем пользователям: {comparisonStats.allAverageMonthly}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={fetchComparisonStats}>
                  Обновить статистику
                </Button>
              </Box>
            </Box>
          )}
          <hr style={{ margin: '20px 0', borderColor: '#ddd' }} />
        </Box>

        <Box id="friends" sx={{ mb: 4 }}>
          <Typography variant="h6">Найти пользователя</Typography>
          <TextField
            label="Поиск пользователя"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={fetchUsers} sx={{ mt: 2 }}>
            Искать
          </Button>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Имя пользователя</TableCell>
                  <TableCell>Действие</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddFriend(user.user_id)}
                      >
                        Добавить в друзья
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6">Ваши друзья</Typography>
          {friends.length === 0 ? (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Нет друзей
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Имя пользователя</TableCell>
                      <TableCell align="right">Действие</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {friends.map((friend) => (
                      <TableRow key={friend.friendId}>
                        <TableCell>{friend.friendName}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedFriendshipId(friend.friendshipId);
                              setOpenDialog(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                count={friendsTotalPages}
                page={friendsPage}
                onChange={(e, value) => setFriendsPage(value)}
                sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
              />
            </>
          )}
          <hr style={{ margin: '40px 0', borderColor: '#ddd' }} />
        </Box>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить этого друга?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
            <Button onClick={handleRemoveFriend} color="error" autoFocus>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        <Box id="notifications" sx={{ mb: 4 }}>
          <Typography variant="h6">Уведомления</Typography>
          {notifications.length === 0 ? (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Нет уведомлений
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Имя пользователя</TableCell>
                    <TableCell>Тип уведомления</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell align="right">Действие</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((notification, index) => (
                    <TableRow key={index}>
                      <TableCell>{notification.senderName || 'Имя отсутствует'}</TableCell>
                      <TableCell>
                        {notification.type === 'friendRequest'
                          ? 'Запрос на дружбу'
                          : 'Вызов'}
                      </TableCell>
                      <TableCell>
                        {notification.type === 'challenge' && notification.description
                          ? notification.description
                          : 'Не указано'}
                      </TableCell>
                      <TableCell align="right">
                        {notification.type === 'friendRequest' ? (
                          <>
                            <Button
                              variant="contained"
                              onClick={() =>
                                handleRespondNotification(
                                  notification.friend_id,
                                  notification.recieverName,
                                  notification.recieverId,
                                  notification.senderId,
                                  notification.senderName,
                                  true
                                )
                              }
                              sx={{ mr: 1 }}
                            >
                              Принять
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() =>
                                handleRespondNotification(
                                  notification.friend_id,
                                  notification.recieverName,
                                  notification.recieverId,
                                  notification.senderId,
                                  notification.senderName,
                                  false
                                )
                              }
                            >
                              Отклонить
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="contained"
                              onClick={() => handleAcceptChallenge(notification.challengeId)}
                              sx={{ mr: 1 }}
                            >
                              Принять вызов
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleRejectChallenge(notification.challengeId)}
                            >
                              Отклонить вызов
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </>
  );
};

export default UserDashboard;