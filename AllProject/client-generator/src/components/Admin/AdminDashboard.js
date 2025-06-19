import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Pagination,
  Modal,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ activity_name: '', activity_type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Глобальная статистика
  const [globalStats, setGlobalStats] = useState({
    totalMonthlyCompleted: 0,
    totalYearlyCompleted: 0,
    topUsers: [],
  });

  // Персональная статистика
  const [openUserStats, setOpenUserStats] = useState(false);
  const [userStats, setUserStats] = useState({
    username: '',
    monthlyCompleted: 0,
    yearlyCompleted: 0,
    categoriesStats: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchActivities();
    fetchGlobalStats();
  }, [userPage, activityPage]);

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/user/users`, {
        params: { searchTerm, page: userPage, pageSize: 5 },
      });
      setUsers(response.data.users || []);
      setUserTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError('Не удалось загрузить пользователей.');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/activity/activities`, {
        params: { page: activityPage, pageSize: 5 },
      });
      setActivities(response.data.activities || []);
      setActivityTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Ошибка загрузки активностей:', err);
      setError('Не удалось загрузить активности.');
    }
  };

  const handleAddActivity = async () => {
    try {
      await api.post('/activity', newActivity);
      setNewActivity({ activity_name: '', activity_type: '' });
      fetchActivities();
      setSnackbarMessage('Активность добавлена успешно');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (err) {
      console.error('Ошибка добавления активности:', err);
      setError('Не удалось добавить активность.');
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const response = await api.get('/stats/admin');
      setGlobalStats(response.data);
    } catch (err) {
      console.error('Ошибка загрузки глобальной статистики:', err);
      setError('Не удалось загрузить глобальную статистику.');
    }
  };

  const handleOpenUserStats = async (username) => {
    try {
      const response = await api.get('/stats/user', {
        params: { username },
      });
      setUserStats({
        username,
        monthlyCompleted: response.data.monthlyCompleted,
        yearlyCompleted: response.data.yearlyCompleted,
        categoriesStats: response.data.categoriesStats || [],
      });
      setOpenUserStats(true);
    } catch (err) {
      console.error(`Ошибка загрузки статистики пользователя ${username}:`, err);
      setError('Не удалось загрузить статистику пользователя.');
    }
  };

  const handleCloseUserStats = () => {
    setOpenUserStats(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/activity/${selectedId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.status === 200 || response.status === 204) {
        setActivities((prev) => prev.filter((a) => a.activity_id !== selectedId));
        setSnackbarMessage('Активность удалена успешно');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Ошибка при удалении активности');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setSnackbarMessage('Ошибка сети при удалении активности');
      setSnackbarSeverity('error');
    }
    setOpenSnackbar(true);
    setOpenDialog(false);
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
    }
  };

  const globalStatsChartData = {
    labels: ['Ежемесячные вызовы', 'Ежегодные вызовы'],
    datasets: [
      {
        label: 'Выполненные вызовы',
        data: [globalStats.totalMonthlyCompleted, globalStats.totalYearlyCompleted],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Данные для круговой диаграммы (топ-категории)
  const topCategoriesChartData = {
    labels: globalStats.topUsers.flatMap((user) =>
      user.categories ? user.categories.map((cat) => cat.category) : []
    ),
    datasets: [
      {
        label: 'Категории',
        data: globalStats.topUsers.flatMap((user) =>
          user.categories ? user.categories.map((cat) => cat.completedCalls) : []
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

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

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Страница администратора
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Глобальная статистика */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h5">Глобальная статистика</Typography>
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
              <strong>Выполненных вызовов (этот месяц):</strong> {globalStats.totalMonthlyCompleted}
            </Typography>
            <Typography>
              <strong>Выполненных вызовов (этот год):</strong> {globalStats.totalYearlyCompleted}
            </Typography>
          </Box>

          {/* График глобальной статистики */}
          <Box sx={{ maxWidth: 600 }}>
            <Bar
              data={globalStatsChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Выполненные вызовы' },
                },
              }}
            />
          </Box>

          {/* Круговая диаграмма для топ-категорий */}
          {topCategoriesChartData.labels.length > 0 && (
            <Box sx={{ maxWidth: 600 }}>
              <Pie
                data={topCategoriesChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Распределение по категориям' },
                  },
                }}
              />
            </Box>
          )}

          {/* Таблица топ-10 пользователей */}
          <Box>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Топ-10 пользователей по выполненным вызовам
            </Typography>
            {globalStats.topUsers && globalStats.topUsers.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Пользователь</TableCell>
                      <TableCell align="center">Всего выполнено</TableCell>
                      <TableCell>Категории</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {globalStats.topUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell align="center">{user.completedCalls}</TableCell>
                        <TableCell>
                          {user.categories && user.categories.length > 0 ? (
                            <Box>
                              {user.categories.map((cat, idx) => (
                                <Typography key={idx} variant="body2">
                                  <strong>{cat.category}:</strong> {cat.completedCalls} вызов(ов)
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            'Нет данных'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography sx={{ mt: 2 }}>Нет данных для отображения.</Typography>
            )}

            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={fetchGlobalStats}>
                Обновить статистику
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Добавление активности */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Добавить новую активность</Typography>
        <TextField
          label="Название активности"
          value={newActivity.activity_name}
          onChange={(e) => setNewActivity({ ...newActivity, activity_name: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Тип активности"
          value={newActivity.activity_type}
          onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" onClick={handleAddActivity} sx={{ mt: 2 }}>
          Добавить
        </Button>
      </Box>

      {/* Список активностей */}
      <Box>
        <Typography variant="h6">Список активностей</Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название активности</TableCell>
                <TableCell>Тип активности</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.activity_id}>
                  <TableCell>{activity.activity_name}</TableCell>
                  <TableCell>{activity.activity_type}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedId(activity.activity_id);
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
          count={activityTotalPages}
          page={activityPage}
          onChange={(e, value) => setActivityPage(value)}
          sx={{ mt: 2 }}
        />

        {/* Диалоговое окно подтверждения */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Удалить активность?</DialogTitle>
          <DialogContent>Вы уверены, что хотите удалить эту активность?</DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
              Отмена
            </Button>
            <Button onClick={handleDeleteConfirm} color="error">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Уведомления */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>

      {/* Список пользователей */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Список пользователей</Typography>
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
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenUserStats(user.username)}
                    >
                      Статистика
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination
          count={userTotalPages}
          page={userPage}
          onChange={(e, value) => setUserPage(value)}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Модальное окно: статистика конкретного пользователя */}
      <Modal open={openUserStats} onClose={handleCloseUserStats}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статистика пользователя: {userStats.username}
              </Typography>
              <Typography>
                <strong>Выполнено за месяц:</strong> {userStats.monthlyCompleted}
              </Typography>
              <Typography>
                <strong>Выполнено за год:</strong> {userStats.yearlyCompleted}
              </Typography>

              {/* График персональной статистики */}
              {userStats.categoriesStats.length > 0 && (
                <Box sx={{ maxWidth: 600, mt: 2 }}>
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
              )}

              {/* Таблица категорий */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Статистика по категориям:</Typography>
                {userStats.categoriesStats && userStats.categoriesStats.length > 0 ? (
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

              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button variant="outlined" onClick={handleCloseUserStats}>
                  Закрыть
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Modal>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Выйти
        </Button>
      </Box>
    </Container>
  );
};

export default AdminDashboard;