import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  getActiveTournament,
  getMatchesByTournamentAndRound,
  getRoundsByTournament,
  getUserPredictionsByRound,
  createPrediction,
  updatePrediction,
  isRoundOpen,
} from '../../services/api';
import { supabase } from '../../lib/supabase';


const MyPredictions = () => {
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [pendingPredictions, setPendingPredictions] = useState({});
  const [roundStatus, setRoundStatus] = useState({ is_open: false, deadline: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Загружаем турнир и туры
  useEffect(() => {
    loadTournamentAndRounds();
  }, []);

  // Загружаем матчи и прогнозы при смене тура
  useEffect(() => {
    if (tournament && selectedRound) {
      loadMatchesAndPredictions();
    }
  }, [tournament, selectedRound]);

  const loadTournamentAndRounds = async () => {
    try {
      setLoading(true);
      
      // Получаем активный турнир
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        // Получаем туры
        const { data: roundsData } = await getRoundsByTournament(tournamentData.id);
        setRounds(roundsData);
        
        // Выбираем первый открытый тур или первый доступный
        const openRound = roundsData.find(r => r.is_open);
        const firstRound = roundsData[0];
        setSelectedRound(openRound?.round_number || firstRound?.round_number || null);
      }
    } catch (error) {
      showSnackbar('Ошибка загрузки турнира', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchesAndPredictions = async () => {
    if (!tournament || !selectedRound) return;
    
    try {
      setLoading(true);
      
      // Получаем матчи тура
      const { data: matchesData } = await getMatchesByTournamentAndRound(tournament.id, selectedRound);
      setMatches(matchesData || []);
      
      // Получаем статус тура
      const status = await isRoundOpen(tournament.id, selectedRound);
      setRoundStatus(status);
      
      // Получаем прогнозы пользователя
      if (user?.id) {
        const { data: predictionsData } = await getUserPredictionsByRound(user.id, tournament.id, selectedRound);
        setPredictions(predictionsData);
        
        // Инициализируем временные прогнозы существующими значениями
        const initialPending = {};
        matchesData?.forEach(match => {
          const existing = predictionsData[match.id];
          if (existing) {
            initialPending[match.id] = {
              homeScore: existing.home_score,
              awayScore: existing.away_score,
            };
          }
        });
        setPendingPredictions(initialPending);
      }
      
    } catch (error) {
      showSnackbar('Ошибка загрузки матчей', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Обновление прогноза
  const handlePredictionChange = (matchId, type, value) => {
    if (!roundStatus.is_open) return;
    
    setPendingPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: value === '' ? '' : Number(value),
      },
    }));
  };

  // Функция расчёта очков
const calculatePointsForPrediction = (homeScore, awayScore, actualHome, actualAway) => {
  if (actualHome === undefined || actualAway === undefined) return 0;
  
  // Точный счёт
  if (homeScore === actualHome && awayScore === actualAway) {
    return 3;
  }
  
  // Разница голов
  if ((homeScore - awayScore) === (actualHome - actualAway)) {
    return 2;
  }
  
  // Исход
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  if (getOutcome(homeScore, awayScore) === getOutcome(actualHome, actualAway)) {
    return 1;
  }
  
  return 0;
};

  // Сохранение всех прогнозов тура
  const handleSaveRound = async () => {
  if (!roundStatus.is_open) {
    showSnackbar('Невозможно сохранить: дедлайн прошёл', 'error');
    return;
  }
  
  setSaving(true);
  let successCount = 0;
  let errorCount = 0;

  for (const [matchId, pending] of Object.entries(pendingPredictions)) {
    const match = matches.find(m => m.id === Number(matchId));
    if (!match) continue;
    
    if (pending.homeScore === undefined || pending.awayScore === undefined || 
        pending.homeScore === '' || pending.awayScore === '') {
      continue;
    }
    
    try {
      const existing = predictions[matchId];
      
      // Рассчитываем очки, если матч завершён
      let pointsEarned = 0;
      let isExact = false;
      let isExactDiff = false;
      let isCorrectResult = false;
      
      if (match.is_finished && match.actual_home_score !== null) {
        pointsEarned = calculatePointsForPrediction(
          pending.homeScore,
          pending.awayScore,
          match.actual_home_score,
          match.actual_away_score
        );
        
        // Определяем тип точности
        if (pending.homeScore === match.actual_home_score && pending.awayScore === match.actual_away_score) {
          isExact = true;
        } else if ((pending.homeScore - pending.awayScore) === (match.actual_home_score - match.actual_away_score)) {
          isExactDiff = true;
        } else {
          const getOutcome = (home, away) => {
            if (home > away) return 'home';
            if (away > home) return 'away';
            return 'draw';
          };
          isCorrectResult = getOutcome(pending.homeScore, pending.awayScore) === 
                           getOutcome(match.actual_home_score, match.actual_away_score);
        }
      }
      
      if (existing) {
        // Обновляем существующий прогноз с очками
        const { error } = await supabase
          .from('predictions')
          .update({ 
            home_score: pending.homeScore,
            away_score: pending.awayScore,
            points_earned: pointsEarned,
            is_exact_score: isExact,
            is_exact_difference: isExactDiff,
            is_correct_result: isCorrectResult,
            updated_at: new Date()
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Создаём новый прогноз с очками
        const { error } = await supabase
          .from('predictions')
          .insert({
            match_id: Number(matchId),
            user_id: user?.id,
            home_score: pending.homeScore,
            away_score: pending.awayScore,
            match_name: `${match.home_team} — ${match.away_team}`,
            friend_name: user?.email?.split('@')[0] || 'Аноним',
            tournament_id: tournament.id,
            points_earned: pointsEarned,
            is_exact_score: isExact,
            is_exact_difference: isExactDiff,
            is_correct_result: isCorrectResult,
            created_at: new Date()
          });
          
        if (error) throw error;
      }
      successCount++;
    } catch (error) {
      errorCount++;
      console.error('Ошибка сохранения:', error);
    }
  }
  
  if (successCount > 0) {
    showSnackbar(`✅ Сохранено ${successCount} прогнозов`, errorCount > 0 ? 'warning' : 'success');
    await loadMatchesAndPredictions();
  } else if (errorCount > 0) {
    showSnackbar(`❌ Ошибка при сохранении ${errorCount} прогнозов`, 'error');
  }
  
  setSaving(false);
};

  // Форматирование даты
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' });
  };

  // Форматирование времени
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  // Форматирование дедлайна
  const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filledCount = Object.values(pendingPredictions).filter(p => 
    p.homeScore !== undefined && p.homeScore !== '' && 
    p.awayScore !== undefined && p.awayScore !== ''
  ).length;

  const totalMatches = matches.length;

  if (loading && !matches.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          🏆 Нет активного турнира
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Дождитесь начала турнира или обратитесь к администратору
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 700 }}>
        📝 Мои прогнозы
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {tournament.name} {tournament.year}
      </Typography>

      {/* Выбор тура */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedRound}
          onChange={(e, newValue) => setSelectedRound(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {rounds.map(round => (
            <Tab
              key={round.round_number}
              value={round.round_number}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Тур {round.round_number}</span>
                  {!round.is_open && round.deadline && (
                    <LockIcon fontSize="small" color="disabled" />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Статус тура */}
      <Alert 
        severity={roundStatus.is_open ? 'info' : 'warning'}
        icon={roundStatus.is_open ? <ScheduleIcon /> : <WarningIcon />}
        sx={{ mb: 3 }}
      >
        {roundStatus.is_open 
          ? `Приём прогнозов до ${formatDeadline(roundStatus.deadline)}`
          : `Дедлайн тура прошёл ${formatDeadline(roundStatus.deadline)}. Прогнозы больше не принимаются.`
        }
        {roundStatus.is_open && (
          <Chip 
            label={`Прогнозов: ${filledCount}/${totalMatches}`}
            size="small"
            color="primary"
            sx={{ ml: 2 }}
          />
        )}
      </Alert>

      {/* Таблица матчей */}
      {matches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Нет матчей в этом туре
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Дата</b></TableCell>
                <TableCell><b>Матч</b></TableCell>
                <TableCell><b>Стадион</b></TableCell>
                <TableCell align="center" colSpan={2}><b>Мой прогноз</b></TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell align="center"><b>Хозяева</b></TableCell>
                <TableCell align="center"><b>Гости</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((match) => {
                const pending = pendingPredictions[match.id] || {};
                const isDisabled = !roundStatus.is_open;
                
                return (
                  <TableRow key={match.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatDate(match.match_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(match.match_time)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      {match.home_team_code && match.away_team_code && (
                        <Typography variant="caption" color="text.secondary">
                          ({match.home_team_code} - {match.away_team_code})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {match.stadium || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={pending.homeScore !== undefined ? pending.homeScore : ''}
                        onChange={(e) => handlePredictionChange(match.id, 'homeScore', e.target.value)}
                        disabled={isDisabled}
                        inputProps={{ min: 0, max: 20, style: { textAlign: 'center', width: '60px' } }}
                        placeholder="—"
                        sx={{
                          '& input': { fontWeight: 'bold', fontSize: '16px' },
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={pending.awayScore !== undefined ? pending.awayScore : ''}
                        onChange={(e) => handlePredictionChange(match.id, 'awayScore', e.target.value)}
                        disabled={isDisabled}
                        inputProps={{ min: 0, max: 20, style: { textAlign: 'center', width: '60px' } }}
                        placeholder="—"
                        sx={{
                          '& input': { fontWeight: 'bold', fontSize: '16px' },
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Кнопка сохранения */}
      {roundStatus.is_open && matches.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSaveRound}
            disabled={saving || filledCount === 0}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              borderRadius: 3,
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.2s',
            }}
          >
            {saving ? 'Сохранение...' : `Сохранить прогнозы тура (${filledCount}/${totalMatches})`}
          </Button>
        </Box>
      )}

      {/* Ближайшие дедлайны */}
      {rounds.filter(r => !r.is_closed && r.round_number !== selectedRound).length > 0 && (
        <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              Ближайшие дедлайны
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {rounds
                .filter(r => !r.is_closed && r.round_number !== selectedRound)
                .slice(0, 3)
                .map(round => {
                  const isPast = new Date() > new Date(round.deadline);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={round.round_number}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          borderColor: round.round_number === selectedRound ? 'primary.main' : 'divider',
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Тур {round.round_number}
                        </Typography>
                        <Typography variant="body2" color={isPast ? 'error' : 'text.secondary'}>
                          {isPast ? 'Дедлайн прошёл' : `До ${formatDeadline(round.deadline)}`}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
            </Grid>
          </CardContent>
        </Card>
      )}

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

export default MyPredictions;