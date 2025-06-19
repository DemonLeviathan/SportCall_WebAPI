import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
} from "@mui/material";
import api from "../../services/api";
import GoalSteps from "./GoalSteps";

const UserGoals = () => {
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [updatedGoalName, setUpdatedGoalName] = useState("");
  const [updatedGoalDescription, setUpdatedGoalDescription] = useState("");
  const [updatedGoalStatus, setUpdatedGoalStatus] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editGoalId, setEditGoalId] = useState(null);

  const getCurrentUserId = async () => {
    try {
      const username = localStorage.getItem("currentUser");
      if (!username) throw new Error("Имя пользователя отсутствует в localStorage.");

      const response = await api.get("/user/get-id", { params: { username } });
      return response.data.user_id;
    } catch (err) {
      console.error("Ошибка получения ID текущего пользователя:", err);
      setError("Не удалось получить ID пользователя");
      return null;
    }
  };

  useEffect(() => {
    fetchGoals(page);
  }, [page]);

  const fetchGoals = async (pageNumber = 1) => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) return;

      const response = await api.get("/goals", {
        params: { userId: currentUserId, page: pageNumber, limit: 5 },
      });

      if (response.data.goals) {
        setGoals(response.data.goals);
        setTotalPages(response.data.totalPages);
      } else {
        setGoals([]);
        setError("Не удалось загрузить цели");
      }
    } catch (err) {
      console.error("Ошибка загрузки целей:", err);
      setError("Ошибка при загрузке списка целей");
      setGoals([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return;

    const goalData = {
      goalName,
      goalDescription,
      userId: currentUserId,
      status: "Не выполнено",
    };

    try {
      await api.post("/goals", goalData);
      setGoalName("");
      setGoalDescription("");
      fetchGoals(page);
    } catch (err) {
      console.error("Ошибка при добавлении цели:", err);
      setError("Не удалось добавить цель");
    }
  };

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
    setEditGoalId(goal.goalId);
    setUpdatedGoalName(goal.goalName);
    setUpdatedGoalDescription(goal.goalDescription);
    setUpdatedGoalStatus(goal.status);
    console.log("Выбрана цель:", goal);
    console.log("goalId:", goal.goalId);
  };

  const handleUpdateGoal = async () => {
    console.log("editGoalId перед обновлением:", editGoalId);

    if (!editGoalId) {
      console.error("Ошибка: goalId не найден");
      return;
    }

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return;

    const newGoalStatus = updatedGoalStatus === "Не выполнено" ? "Выполнено" : "Не выполнено";

    const updatedGoalData = {
      goalId: editGoalId,
      goalName: updatedGoalName,
      goalDescription: updatedGoalDescription,
      userId: currentUserId,
      status: newGoalStatus,
    };

    try {
      await api.put(`/goals`, updatedGoalData);
      fetchGoals(page);
      setSelectedGoal(null);
      setEditGoalId(null);
    } catch (err) {
      console.error("Ошибка обновления цели:", err);
      setError("Не удалось обновить цель");
    }
  };

  const handleDeleteGoal = async () => {
    if (!editGoalId) {
      console.error("Ошибка: goalId не найден");
      return;
    }

    try {
      await api.delete(`/goals/${editGoalId}`);
      fetchGoals(page);
      setSelectedGoal(null);
      setEditGoalId(null);
    } catch (err) {
      console.error("Ошибка удаления цели:", err);
      setError("Не удалось удалить цель");
    }
    setOpenDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button
        variant="contained"
        onClick={() => setIsFormVisible(!isFormVisible)}
        sx={{ mb: 2 }}
      >
        {isFormVisible ? "Скрыть форму" : "Добавить цель"}
      </Button>

      {isFormVisible && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}
        >
          <TextField
            label="Название цели"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Описание цели"
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained">
            Добавить цель
          </Button>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {goals.length > 0 ? (
        <List>
          {goals.map((goal) => (
            <ListItem
              key={goal.goalId}
              button
              onClick={() => handleGoalClick(goal)}
              sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
            >
              <ListItemText
                primary={goal.goalName}
                secondary={`Статус: ${goal.status}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ mt: 2 }}>Целей пока нет.</Typography>
      )}

      {selectedGoal && (
        <Paper sx={{ mt: 2, p: 3, boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom>
            {selectedGoal.goalName}
          </Typography>
          <Typography>
            <strong>Описание:</strong> {selectedGoal.goalDescription}
          </Typography>
          <Typography>
            <strong>Статус:</strong> {selectedGoal.status}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedGoal(null)}
            >
              Закрыть
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateGoal}
            >
              Обновить
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Удалить
            </Button>
          </Box>
          <GoalSteps goalId={selectedGoal.goalId} />
        </Paper>
      )}

      <Pagination
        count={totalPages}
        page={page}
        onChange={(event, value) => setPage(value)}
        sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
      />

      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить эту цель?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteGoal} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserGoals;