import { useState, useEffect } from 'react';
import { Grid, CircularProgress, Alert, Typography, Box, Card, CardContent, Chip, Button, Paper, alpha, useTheme } from '@mui/material';
import { getMatches, getActiveTournament, getTournamentParticipants, getPredictions, createPrediction } from '../services/api';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from './Auth/AuthButton';
import PredictionForm from './PredictionForm';
import PredictionsTable from './PredictionsTable';

const MatchList = ({ onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [tournament, setTournament] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: matchesData } = await getMatches(tournamentData.id);
        
        const sortedMatches = [...(matchesData || [])].sort((a, b) => {
          const dateA = new Date(`${a.match_date}T${a.match_time}Z`);
          const dateB = new Date(`${b.match_date}T${b.match_time}Z`);
          return dateA - dateB;
        });
        
        const now = new Date();
        const futureMatches = sortedMatches.filter(m => {
          const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
          return matchDate > now;
        });
        
        const upcoming = futureMatches.slice(0, 4);
        setUpcomingMatches(upcoming.length > 0 ? upcoming : sortedMatches.slice(0, 4));
        
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipantsCount(participantsData?.length || 0);
        
        const { data: predictionsData } = await getPredictions();
        const tournamentPredictions = predictionsData?.filter(p => p.tournament_id === tournamentData.id) || [];
        setTotalPredictions(tournamentPredictions.length);
        
        // Группируем прогнозы по матчам
        const predictionsMap = {};
        tournamentPredictions.forEach(p => {
          if (!predictionsMap[p.match_id]) {
            predictionsMap[p.match_id] = [];
          }
          predictionsMap[p.match_id].push(p);
        });
        setPredictions(predictionsMap);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (predictionData) => {
    if (!user) {
      showAuthModal(0);
      return;
    }
    
    try {
      const match = upcomingMatches.find(m => m.id === predictionData.matchId);
      const matchName = `${match.home_team} — ${match.away_team}`;
      
      await createPrediction({ 
        ...predictionData, 
        matchName,
        tournamentId: tournament?.id 
      });
      
      // Перезагружаем данные
      await loadHomeData();
      setSelectedMatch(null);
      alert('✅ Прогноз сохранен!');
    } catch (error) {
      alert('❌ Ошибка при сохранении: ' + error.message);
    }
  };

  const formatMatchDate = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} • ${timeStr?.slice(0, 5)}`;
  };

  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Приветствие */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {user ? `Привет, ${user.email?.split('@')[0]}! 👋` : 'Добро пожаловать! 🏆'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Делай прогнозы на матчи {tournament?.name} {tournament?.year} и соревнуйся с друзьями
        </Typography>
      </Box>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            }}
          >
            <PeopleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {participantsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">участников</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.success.main, 0.03),
            }}
          >
            <ScoreboardIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {totalPredictions}
            </Typography>
            <Typography variant="body2" color="text.secondary">всего прогнозов</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.warning.main, 0.03),
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {upcomingMatches.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">ближайших матчей</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Ближайшие матчи */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        🗓️ Ближайшие матчи
      </Typography>
      
      {upcomingMatches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Нет предстоящих матчей</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {upcomingMatches.map((match) => {
            const matchPredictions = predictions[match.id] || [];
            
            return (
              <Grid item xs={12} sm={6} md={3} key={match.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Chip
                      label={`Тур ${match.round_number}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 1, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatMatchDate(match.match_date, match.match_time)}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {match.home_team} <span style={{ color: theme.palette.text.secondary }}>—</span> {match.away_team}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      🏟️ {match.stadium}
                    </Typography>
                    
                    {/* Кнопка для авторизованных пользователей */}
                    {user ? (
                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => setSelectedMatch(selectedMatch?.id === match.id ? null : match)}
                        sx={{ mt: 1 }}
                      >
                        {selectedMatch?.id === match.id ? '✖️ Скрыть форму' : '📝 Сделать прогноз'}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<LockIcon />}
                        onClick={() => showAuthModal(0)}
                        sx={{ mt: 1 }}
                        color="secondary"
                      >
                        Войдите чтобы сделать прогноз
                      </Button>
                    )}
                    
                    {/* Форма прогноза (только для авторизованных) */}
                    {user && selectedMatch?.id === match.id && (
                      <PredictionForm 
                        match={{
                          id: match.id,
                          home: match.home_team,
                          away: match.away_team,
                        }} 
                        onPredict={handlePrediction} 
                      />
                    )}
                    
                    {/* Таблица прогнозов
                    <PredictionsTable 
                      predictions={matchPredictions}
                      matchName={`${match.home_team} — ${match.away_team}`}
                    /> */}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Быстрый доступ */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => handleNavigate('calendar')}
        >
          Все матчи
        </Button>
        <Button
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={() => handleNavigate('participants')}
        >
          Участники
        </Button>
        <Button
          variant="outlined"
          startIcon={<ScoreboardIcon />}
          onClick={() => handleNavigate('stats')}
        >
          Статистика
        </Button>
      </Box>
    </Box>
  );
};

export default MatchList;