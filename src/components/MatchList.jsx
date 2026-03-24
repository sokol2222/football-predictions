import { useState, useEffect } from 'react';
import { Grid, CircularProgress, Alert, Typography, Button } from '@mui/material';
import { getPredictions, createPrediction } from '../services/api';
import MatchCard from './MatchCard';
import PredictionForm from './PredictionForm';
import PredictionsTable from './PredictionsTable';
import ProtectedRoute from './Auth/ProtectedRoute';

const MatchList = () => {
  const [matches] = useState([
    { id: 1, home: 'Спартак', away: 'ЦСКА', date: '2024-03-15', time: '19:00', stadium: 'Открытие Арена' },
    { id: 2, home: 'Зенит', away: 'Локомотив', date: '2024-03-16', time: '16:30', stadium: 'Газпром Арена' },
    { id: 3, home: 'Динамо', away: 'Краснодар', date: '2024-03-17', time: '18:00' },
  ]);

  const [predictions, setPredictions] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const response = await getPredictions();
      setPredictions(response.data || []);
      setError(null);
    } catch (error) {
      setError('Не удалось загрузить прогнозы. Проверь подключение к базе данных.');
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (predictionData) => {
    try {
      const match = matches.find(m => m.id === predictionData.matchId);
      const matchName = `${match.home} - ${match.away}`;
      
      await createPrediction({ ...predictionData, matchName });
      await loadPredictions();
      setSelectedMatch(null);
      alert('✅ Прогноз сохранен!');
    } catch (error) {
      alert('❌ Ошибка при сохранении: ' + error.message);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', m: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ mt: 2, mb: 3 }}>
        ⚽ Ближайшие матчи
      </Typography>
      
      <Grid container spacing={3}>
        {matches.map(match => {
          const matchPredictions = predictions.filter(p => p.match_id === match.id);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={match.id}>
              <MatchCard match={match} />
              
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => setSelectedMatch(
                  selectedMatch?.id === match.id ? null : match
                )}
                sx={{ mt: 1 }}
                fullWidth
              >
                {selectedMatch?.id === match.id ? '✖️ Скрыть форму' : '📝 Сделать прогноз'}
              </Button>
              
              {selectedMatch?.id === match.id && (
                <ProtectedRoute>
                  <PredictionForm match={match} onPredict={handlePrediction} />
                </ProtectedRoute>
              )}
              
              <PredictionsTable 
                predictions={matchPredictions}
                matchName={`${match.home} - ${match.away}`}
              />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

export default MatchList;