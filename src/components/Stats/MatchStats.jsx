import { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import {
  SportsSoccer as SoccerIcon,
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
  EmojiEvents as TrophyIcon,
  List as ListIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';

// Функция расчёта очков
const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) {
    return { points: 0, isExact: false, isCorrectResult: false, isExactDiff: false };
  }
  
  const homeScore = prediction.homeScore;
  const awayScore = prediction.awayScore;
  const actualHome = actualResult.home;
  const actualAway = actualResult.away;
  
  if (homeScore === actualHome && awayScore === actualAway) {
    return { points: 3, isExact: true, isExactDiff: false, isCorrectResult: false };
  }
  
  if ((homeScore - awayScore) === (actualHome - actualAway)) {
    return { points: 2, isExact: false, isExactDiff: true, isCorrectResult: false };
  }
  
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  if (getOutcome(homeScore, awayScore) === getOutcome(actualHome, actualAway)) {
    return { points: 1, isExact: false, isExactDiff: false, isCorrectResult: true };
  }
  
  return { points: 0, isExact: false, isExactDiff: false, isCorrectResult: false };
};

const MatchStats = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' или 'single'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMatch && viewMode === 'single') {
      loadMatchPredictions();
    }
  }, [selectedMatch, participants, allPredictions]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: matchesData } = await getMatches(tournamentData.id);
        setMatches(matchesData || []);
        
        const uniqueRounds = [...new Set(matchesData.map(m => m.round_number))].sort((a,b) => a-b);
        setRounds(uniqueRounds);
        
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        const predictionsMap = {};
        for (const participant of participantsData) {
          const { data: userPredictions } = await getUserPredictionsForTournament(
            participant.user_id,
            tournamentData.id
          );
          
          const userPredictionsMap = {};
          userPredictions?.forEach(p => {
            userPredictionsMap[p.match_id] = p;
          });
          predictionsMap[participant.user_id] = userPredictionsMap;
        }
        setAllPredictions(predictionsMap);
        
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

  const loadMatchPredictions = () => {
    // Данные уже загружены в allPredictions, просто обновляем отображение
    setLoading(false);
  };

  // Фильтрация матчей по туру
  const filteredMatches = useMemo(() => {
    if (selectedRound === 'all') return matches;
    return matches.filter(m => m.round_number === selectedRound);
  }, [matches, selectedRound]);

  // Получить прогноз участника на матч
  const getPredictionForMatch = (userId, matchId) => {
    return allPredictions[userId]?.[matchId] || null;
  };

  // Получить все прогнозы для всех матчей (сводная таблица)
  const getAllMatchesPredictions = () => {
    const result = [];
    
    for (const match of filteredMatches) {
      const actualResult = match.is_finished && match.actual_home_score !== null
        ? { home: match.actual_home_score, away: match.actual_away_score }
        : null;
      
      const matchPredictions = [];
      for (const participant of participants) {
        const prediction = getPredictionForMatch(participant.user_id, match.id);
        const pointsData = prediction && actualResult 
          ? calculatePoints(
              { homeScore: prediction.home_score, awayScore: prediction.away_score },
              actualResult
            )
          : null;
        
        matchPredictions.push({
          participantName: participant.display_name,
          participantId: participant.user_id,
          prediction: prediction ? `${prediction.home_score}:${prediction.away_score}` : '—',
          points: pointsData?.points || 0,
          isExact: pointsData?.isExact || false,
          isExactDiff: pointsData?.isExactDiff || false,
          isCorrectResult: pointsData?.isCorrectResult || false,
        });
      }
      
      result.push({
        matchId: match.id,
        matchName: `${match.home_team} — ${match.away_team}`,
        matchNumber: match.match_number,
        round: match.round_number,
        date: match.match_date,
        time: match.match_time,
        actualResult: actualResult ? `${actualResult.home}:${actualResult.away}` : '—',
        isFinished: match.is_finished,
        predictions: matchPredictions,
      });
    }
    
    return result;
  };

  // Получить прогнозы для одного матча
  const getSingleMatchPredictions = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match) return [];
    
    const actualResult = match.is_finished && match.actual_home_score !== null
      ? { home: match.actual_home_score, away: match.actual_away_score }
      : null;
    
    const predictionsList = [];
    for (const participant of participants) {
      const prediction = getPredictionForMatch(participant.user_id, match.id);
      const pointsData = prediction && actualResult 
        ? calculatePoints(
            { homeScore: prediction.home_score, awayScore: prediction.away_score },
            actualResult
          )
        : null;
      
      predictionsList.push({
        participantName: participant.display_name,
        participantId: participant.user_id,
        prediction: prediction ? `${prediction.home_score}:${prediction.away_score}` : '—',
        points: pointsData?.points || 0,
        isExact: pointsData?.isExact || false,
        isExactDiff: pointsData?.isExactDiff || false,
        isCorrectResult: pointsData?.isCorrectResult || false,
      });
    }
    
    predictionsList.sort((a, b) => b.points - a.points);
    return { match, predictionsList, actualResult };
  };

  const allMatchesData = getAllMatchesPredictions();
  const singleMatchData = getSingleMatchPredictions();

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
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
        📊 Статистика по матчам
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Прогнозы участников — все матчи или выборочно
      </Typography>

      {/* Переключатель режимов */}
      <Tabs
        value={viewMode}
        onChange={(e, v) => setViewMode(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          value="all" 
          label="📋 Все матчи" 
          icon={<ListIcon />} 
          iconPosition="start"
        />
        <Tab 
          value="single" 
          label="🎯 Один матч" 
          icon={<TimelineIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* Режим: Все матчи */}
      {viewMode === 'all' && (
        <>
          {/* Фильтр по туру */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Тур</InputLabel>
                  <Select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    label="Тур"
                  >
                    <MenuItem value="all">Все туры ({matches.length} матчей)</MenuItem>
                    {rounds.map(round => (
                      <MenuItem key={round} value={round}>
                        Тур {round} ({matches.filter(m => m.round_number === round).length} матчей)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<ExactIcon />} label="Точный счёт (3)" size="small" />
                  <Chip icon={<DiffIcon />} label="Разница (2)" size="small" />
                  <Chip icon={<ResultIcon />} label="Исход (1)" size="small" />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Сводная таблица по всем матчам */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Матч</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Результат</TableCell>
                  {participants.map(p => (
                    <TableCell key={p.user_id} sx={{ color: 'white', fontWeight: 700 }} align="center">
                      {p.display_name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allMatchesData.map((match) => (
                  <TableRow key={match.matchId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {match.matchName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Тур {match.round} • {new Date(match.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {match.actualResult !== '—' ? (
                        <Chip label={match.actualResult} size="small" color="primary" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    {match.predictions.map((pred, idx) => (
                      <TableCell key={idx} align="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {pred.prediction}
                          </Typography>
                          {pred.points > 0 && (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                              +{pred.points}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Режим: Один матч */}
      {viewMode === 'single' && (
        <>
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
                {singleMatchData.match && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(singleMatchData.match.match_date).toLocaleDateString()} • {singleMatchData.match.match_time?.slice(0, 5)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {singleMatchData.match.stadium}, {singleMatchData.match.city}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Таблица прогнозов для одного матча */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell width={50}>#</TableCell>
                  <TableCell>Участник</TableCell>
                  <TableCell align="center" width={120}>Прогноз</TableCell>
                  {singleMatchData.actualResult && (
                    <>
                      <TableCell align="center" width={100}>Результат</TableCell>
                      <TableCell align="center" width={80}>Очки</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {singleMatchData.predictionsList.map((pred, index) => (
                  <TableRow key={pred.participantId} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                          {pred.participantName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{pred.participantName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={pred.prediction}
                        size="small"
                        color={pred.points > 0 ? 'success' : 'default'}
                        variant={pred.prediction !== '—' ? "filled" : "outlined"}
                      />
                    </TableCell>
                    {singleMatchData.actualResult && (
                      <>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {singleMatchData.actualResult.home}:{singleMatchData.actualResult.away}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {pred.points}
                          </Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default MatchStats;