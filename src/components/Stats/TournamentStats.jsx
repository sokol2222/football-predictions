import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';

const TournamentStats = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('predictions', )

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMatch && participants.length > 0) {
      loadPredictionsForMatch();
    }
  }, [selectedMatch, participants]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Получаем активный турнир
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        // Получаем все матчи
        const { data: matchesData } = await getMatches(tournamentData.id);
        setMatches(matchesData || []);
        
        // Получаем участников
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        // Выбираем первый матч по умолчанию
        if (matchesData && matchesData.length > 0) {
          setSelectedMatch(matchesData[0].id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictionsForMatch = async () => {
    try {
      // Загружаем прогнозы всех участников на выбранный матч
      const allPredictions = [];
      
      for (const participant of participants) {
        const { data: userPredictions } = await getUserPredictionsForTournament(
          participant.user_id,
          tournament.id
        );
        
        const matchPrediction = userPredictions?.find(p => p.match_id === selectedMatch);
        
        if (matchPrediction) {
          allPredictions.push({
            participant: participant.display_name,
            participantId: participant.user_id,
            homeScore: matchPrediction.home_score,
            awayScore: matchPrediction.away_score,
            points: matchPrediction.points_earned || 0,
            isExact: matchPrediction.is_exact_score,
            isCorrectResult: matchPrediction.is_correct_result,
            isExactDiff: matchPrediction.is_exact_difference,
          });
        } else {
          allPredictions.push({
            participant: participant.display_name,
            participantId: participant.user_id,
            homeScore: null,
            awayScore: null,
            points: 0,
            isExact: false,
            isCorrectResult: false,
            isExactDiff: false,
          });
        }
      }
      
      // Сортируем по очкам (от большего к меньшему)
      allPredictions.sort((a, b) => b.points - a.points);
      setPredictions(allPredictions);
      
    } catch (error) {
      console.error('Ошибка загрузки прогнозов:', error);
    }
  };

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  const getResultColor = (prediction, actual) => {
    if (!actual) return 'default';
    if (prediction.homeScore === actual.home && prediction.awayScore === actual.away) return 'success';
    if (prediction.homeScore > prediction.awayScore && actual.home > actual.away) return 'success';
    if (prediction.homeScore < prediction.awayScore && actual.home < actual.away) return 'success';
    if (prediction.homeScore === prediction.awayScore && actual.home === actual.away) return 'success';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        📊 Статистика по матчам
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Прогнозы участников на каждый матч
      </Typography>

      {/* Выбор матча */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Выберите матч</InputLabel>
              <Select
                value={selectedMatch || ''}
                onChange={(e) => setSelectedMatch(e.target.value)}
                label="Выберите матч"
              >
                {matches.map((match) => (
                  <MenuItem key={match.id} value={match.id}>
                    {match.match_number && `№${match.match_number} `}
                    {match.home_team} — {match.away_team}
                    {match.is_finished && ' ✅'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedMatchData && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedMatchData.match_date).toLocaleDateString('ru-RU')} • {selectedMatchData.match_time?.slice(0, 5)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedMatchData.stadium}, {selectedMatchData.city}
                </Typography>
                {selectedMatchData.is_finished && selectedMatchData.actual_home_score !== null && (
                  <Chip
                    label={`Результат: ${selectedMatchData.actual_home_score} : ${selectedMatchData.actual_away_score}`}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Таблица прогнозов */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableCell width={50} align="center">#</TableCell>
              <TableCell>Участник</TableCell>
              <TableCell align="center" width={150}>Прогноз</TableCell>
              {selectedMatchData?.is_finished && (
                <>
                  <TableCell align="center" width={100}>Результат</TableCell>
                  <TableCell align="center" width={100}>Очки</TableCell>
                  <TableCell align="center" width={120}>Детали</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.map((pred, index) => (
              <TableRow key={pred.participantId} hover>
                <TableCell align="center">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                      {pred.participant.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pred.participant}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {pred.homeScore !== null ? (
                    <Chip
                      label={`${pred.homeScore} : ${pred.awayScore}`}
                      size="small"
                      color={selectedMatchData?.is_finished ? getResultColor(pred, {
                        home: selectedMatchData.actual_home_score,
                        away: selectedMatchData.actual_away_score
                      }) : 'default'}
                      variant={pred.homeScore !== null ? "filled" : "outlined"}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">— : —</Typography>
                  )}
                </TableCell>
                {selectedMatchData?.is_finished && (
                  <>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedMatchData.actual_home_score} : {selectedMatchData.actual_away_score}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {pred.points}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {pred.isExact && (
                          <Chip
                            icon={<ExactIcon sx={{ fontSize: 14 }} />}
                            label="Точно"
                            size="small"
                            color="success"
                            sx={{ height: 24 }}
                          />
                        )}
                        {pred.isCorrectResult && !pred.isExact && (
                          <Chip
                            icon={<ResultIcon sx={{ fontSize: 14 }} />}
                            label="Исход"
                            size="small"
                            color="info"
                            sx={{ height: 24 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Статистика по матчу */}
      {selectedMatchData?.is_finished && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {predictions.filter(p => p.isExact).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Точных прогнозов
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {predictions.filter(p => p.isCorrectResult && !p.isExact).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Угадавших исход
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {predictions.reduce((sum, p) => sum + p.points, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Всего очков
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default TournamentStats;