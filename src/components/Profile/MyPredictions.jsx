import { useState, useEffect } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Box
} from '@mui/material';
import { getPredictions } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MyPredictions = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPredictions();
  }, [user]);

  const loadUserPredictions = async () => {
    try {
      const { data } = await getPredictions();
      const userPredictions = data.filter(p => 
        p.user_id === user?.id || p.friend_name === user?.email?.split('@')[0]
      );
      setPredictions(userPredictions);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Загрузка...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 Мои прогнозы
      </Typography>

      {predictions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            У вас пока нет прогнозов
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Перейдите в календарь матчей, чтобы сделать первый прогноз!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><b>Матч</b></TableCell>
                <TableCell align="center"><b>Прогноз</b></TableCell>
                <TableCell align="center"><b>Дата прогноза</b></TableCell>
                <TableCell align="center"><b>Статус</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.map((pred) => (
                <TableRow key={pred.id} hover>
                  <TableCell>{pred.match_name}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${pred.home_score} : ${pred.away_score}`}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {new Date(pred.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label="Ожидается"
                      size="small"
                      color="warning"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MyPredictions;