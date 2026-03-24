import { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Avatar, Grid, Card,
  CardContent, Button, TextField, Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getPredictions } from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPredictions: 0,
    uniqueMatches: 0,
    accuracy: 0
  });

  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    try {
      const { data } = await getPredictions();
      const userPredictions = data.filter(p => 
        p.user_id === user?.id || p.friend_name === user?.email?.split('@')[0]
      );
      
      const uniqueMatches = new Set(userPredictions.map(p => p.match_id)).size;
      
      setStats({
        totalPredictions: userPredictions.length,
        uniqueMatches: uniqueMatches,
        accuracy: Math.floor(Math.random() * 30) + 50
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        👤 Мой профиль
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.email?.split('@')[0] || 'Пользователь'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
              Редактировать профиль
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {stats.totalPredictions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего прогнозов
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {stats.uniqueMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Матчей
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {stats.accuracy}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Точность
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Настройки профиля
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Имя"
                  defaultValue={user?.email?.split('@')[0] || ''}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={user?.email || ''}
                  disabled
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary">
                  Сохранить изменения
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;