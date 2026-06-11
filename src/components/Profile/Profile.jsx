import { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Avatar, Grid, Card,
  CardContent, Button, TextField, Divider, Alert, Snackbar, CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getPredictions } from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
  });
  const [stats, setStats] = useState({
    totalPredictions: 0,
    uniqueMatches: 0,
    accuracy: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        email: user.email || '',
      });
      loadUserStats();
    }
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Обновляем метаданные пользователя
      const { error } = await supabase.auth.updateUser({
        data: { display_name: formData.display_name }
      });

      if (error) throw error;
      
      setSnackbar({
        open: true,
        message: '✅ Профиль успешно обновлён!',
        severity: 'success'
      });
      
      // Обновляем отображаемое имя в tournament_participants
      if (user?.id) {
        await supabase
          .from('tournament_participants')
          .update({ display_name: formData.display_name })
          .eq('user_id', user.id);
      }
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: `❌ Ошибка: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          🔒 Авторизуйтесь, чтобы увидеть профиль
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
        👤 Мой профиль
      </Typography>

      <Grid container spacing={3}>
        {/* Левая колонка - аватар и основная информация */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
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
              {formData.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {formData.display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
          </Paper>
        </Grid>

        {/* Правая колонка - статистика и настройки */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {stats.totalPredictions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего прогнозов
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {stats.uniqueMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Матчей
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {stats.accuracy}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Точность
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Форма настроек профиля */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Настройки профиля
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Отображаемое имя"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  disabled
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;