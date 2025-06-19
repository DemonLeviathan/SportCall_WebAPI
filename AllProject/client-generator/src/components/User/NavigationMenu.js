import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavigationMenu = () => {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          SportCall
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/home">
            Главная
          </Button>
          <Button color="inherit" component={Link} to="/calls">
            Вызовы
          </Button>
          <Button color="inherit" component={Link} to="/goals">
            Цели
          </Button>
          <Button color="inherit" component={Link} to="/activity">
            Активность
          </Button>
          <Button color="inherit" component={Link} to="/friends">
            Друзья
          </Button>
          <Button color="inherit" component={Link} to="/notifications">
            Уведомления
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationMenu;
