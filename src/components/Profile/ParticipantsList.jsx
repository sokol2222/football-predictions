import { useState, useEffect } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar,
  Box, LinearProgress, Chip
} from '@mui/material';
import { getPredictions } from '../../services/api';
import { supabase } from '../../lib/supabase';

const ParticipantsList = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const { data: predictions } = await getPredictions();
      
      const stats = users.map(user => {
        const userPredictions = predictions.filter(p => 
          p.user_id === user.id || p.friend_name === user.email?.split('@')[0]
        );
        
        return {
          id: user.id,
          name: user.email?.split('@')[0] || 'Пользователь',
          email: user.email,
          avatar: user.email?.charAt(0).toUpperCase() || '?',
          predictionsCount: userPredictions.length,
          lastPrediction: userPredictions.length > 0 
            ? new Date(Math.max(...userPredictions.map(p => new Date(p.created_at))))
            : null,
        };
      });
      
      stats.sort((a, b) => b.predictionsCount - a.predictionsCount);
      setParticipants(stats);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        👥 Участники
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><b>Участник</b></TableCell>
              <TableCell align="center"><b>Прогнозов</b></TableCell>
              <TableCell align="center"><b>Последний прогноз</b></TableCell>
              <TableCell align="center"><b>Активность</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {participants.map((participant, index) => (
              <TableRow key={participant.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {participant.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {participant.name}
                        {index === 0 && <Chip 
                          label="Лидер" 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1 }}
                        />}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {participant.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6">
                    {participant.predictionsCount}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {participant.lastPrediction 
                    ? participant.lastPrediction.toLocaleDateString('ru-RU')
                    : 'Нет прогнозов'
                  }
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={participant.lastPrediction ? 'Активен' : 'Неактивен'}
                    color={participant.lastPrediction ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParticipantsList;