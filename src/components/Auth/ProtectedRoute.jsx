// src/components/Auth/ProtectedRoute.jsx
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Button, Typography, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
        <LockIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Требуется авторизация
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Чтобы делать прогнозы, войдите или зарегистрируйтесь
        </Typography>
        <Button variant="contained" color="primary">
          Войти / Регистрация
        </Button>
      </Paper>
    );
  }

  return children;
};

export default ProtectedRoute;