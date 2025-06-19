// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#b08f09', 
    },
    secondary: {
      main: '#dc004e', 
    },
  },
  typography: {
    h2: {
      fontWeight: 600,
    },
  },
});

export default theme;
