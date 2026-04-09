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
  Tooltip,
} from '@mui/material';
import {
  SportsSoccer as SoccerIcon,
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';

// Функция расчёта очков (исправленная)
// Точный счёт: 3 очка
// Разница голов: 2 очка
// Исход: 1 очко
const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) {
    return { points: 0, isExact: false, isCorrectResult: false, isExactDiff: false };
  }
  
  const homeScore = prediction.homeScore;
  const awayScore = prediction.awayScore;
  const actualHome = actualResult.home;
  const actualAway = actualResult.away;
  
  // 1. Точный счёт = 3 очка
  if (homeScore === actualHome && awayScore === actualAway) {
    return { points: 3, isExact: true, isExactDiff: false, isCorrectResult: false };
  }
  
  // 2. Разница голов = 2 очка
  const predDiff = homeScore - awayScore;
  const actualDiff = actualHome - actualAway;
  if (predDiff === actualDiff) {
    return { points: 2, isExact: false, isExactDiff: true, isCorrectResult: false };
  }
  
  // 3. Исход матча = 1 очко
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  const predOutcome = getOutcome(homeScore, awayScore);
  const actualOutcome = getOutcome(actualHome, actualAway);
  
  if (predOutcome === actualOutcome) {
    return { points: 1, isExact: false, isExactDiff: false, isCorrectResult: true };
  }
  
  return { points: 0, isExact: false, isExactDiff: false, isCorrectResult: false };
};

const PredictionsMatrixWithRanking = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState('all');
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

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
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
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

  // Получить цвет фона для ячейки прогноза
  const getCellColor = (prediction, actualResult) => {
    if (!actualResult) return 'transparent';
    if (!prediction) return alpha(theme.palette.grey[500], 0.1);
    
    const predHome = prediction.home_score;
    const predAway = prediction.away_score;
    const actualHome = actualResult.home;
    const actualAway = actualResult.away;
    
    // Точный счёт — зелёный
    if (predHome === actualHome && predAway === actualAway) {
      return alpha(theme.palette.success.main, 0.25);
    }
    
    // Разница голов — жёлтый
    const predDiff = predHome - predAway;
    const actualDiff = actualHome - actualAway;
    if (predDiff === actualDiff) {
      return alpha(theme.palette.warning.main, 0.25);
    }
    
    // Исход — синий
    const getOutcome = (home, away) => {
      if (home > away) return 'home';
      if (away > home) return 'away';
      return 'draw';
    };
    
    if (getOutcome(predHome, predAway) === getOutcome(actualHome, actualAway)) {
      return alpha(theme.palette.info.main, 0.25);
    }
    
    // Не угадал — красный
    return alpha(theme.palette.error.main, 0.1);
  };

  // Расчёт очков участника за матч
  const getPointsForMatch = (userId, match, actualResult) => {
    const prediction = getPredictionForMatch(userId, match.id);
    if (!prediction || !actualResult) return 0;
    const pointsData = calculatePoints(
      { homeScore: prediction.home_score, awayScore: prediction.away_score },
      actualResult
    );
    return pointsData.points;
  };

  // Рейтинг участников (общий)
  const participantsRanking = useMemo(() => {
    const ranking = [];
    participants.forEach(participant => {
      let totalPoints = 0;
      let exactCount = 0;
      let diffCount = 0;
      let resultCount = 0;
      let predictionsCount = 0;
      
      matches.forEach(match => {
        if (match.is_finished && match.actual_home_score !== null) {
          const prediction = getPredictionForMatch(participant.user_id, match.id);
          if (prediction) {
            predictionsCount++;
            const actualResult = { home: match.actual_home_score, away: match.actual_away_score };
            const pointsData = calculatePoints(
              { homeScore: prediction.home_score, awayScore: prediction.away_score },
              actualResult
            );
            totalPoints += pointsData.points;
            if (pointsData.isExact) exactCount++;
            if (pointsData.isExactDiff) diffCount++;
            if (pointsData.isCorrectResult) resultCount++;
          }
        }
      });
      
      ranking.push({
        ...participant,
        totalPoints,
        exactCount,
        diffCount,
        resultCount,
        predictionsCount,
      });
    });
    
    return ranking.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [participants, matches, allPredictions]);

  // Получить место участника
  const getParticipantRank = (userId) => {
    const index = participantsRanking.findIndex(p => p.user_id === userId);
    return index !== -1 ? index + 1 : participantsRanking.length;
  };

  // Получить иконку места
  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyIcon sx={{ color: '#FFD700', fontSize: 16 }} />;
    if (rank === 2) return <TrophyIcon sx={{ color: '#C0C0C0', fontSize: 16 }} />;
    if (rank === 3) return <TrophyIcon sx={{ color: '#CD7F32', fontSize: 16 }} />;
    return null;
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
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          📊 Матрица прогнозов с рейтингом
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year} — все прогнозы + места участников
        </Typography>
      </Box>

      {/* Фильтр по туру */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
              <Chip icon={<ExactIcon />} label="Точный счёт (3)" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.2) }} />
              <Chip icon={<DiffIcon />} label="Разница (2)" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2) }} />
              <Chip icon={<ResultIcon />} label="Исход (1)" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.2) }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Матрица прогнозов */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            {/* Шапка с участниками */}
            <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
              <TableCell 
                rowSpan={2} 
                sx={{ 
                  color: theme.palette.common.white,
                  fontWeight: 700, 
                  position: 'sticky', 
                  left: 0, 
                  bgcolor: theme.palette.primary.main, 
                  zIndex: 3,
                  verticalAlign: 'middle',
                  borderRight: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                }}
              >
                Матч
              </TableCell>
              <TableCell 
                rowSpan={2} 
                sx={{ 
                  color: theme.palette.common.white,
                  fontWeight: 700, 
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  borderRight: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                }}
              >
                Результат
              </TableCell>
              {participants.map((participant) => {
                const rank = getParticipantRank(participant.user_id);
                return (
                  <TableCell 
                    key={participant.user_id} 
                    align="center" 
                    sx={{ 
                      color: theme.palette.common.white,
                      fontWeight: 700, 
                      minWidth: 100,
                      verticalAlign: 'top',
                      borderRight: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.common.white, color: theme.palette.primary.main, mb: 0.5 }}>
                        {participant.display_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: theme.palette.common.white, fontWeight: 600 }}>
                        {participant.display_name}
                      </Typography>
                      <Chip 
                        label={`${rank} место`} 
                        size="small" 
                        icon={getRankIcon(rank)}
                        sx={{ 
                          mt: 0.5, 
                          height: 20, 
                          fontSize: '0.6rem',
                          bgcolor: alpha(theme.palette.common.white, 0.2),
                          color: theme.palette.common.white,
                        }} 
                      />
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.8) }}>
              {participants.map((participant) => {
                const participantData = participantsRanking.find(p => p.user_id === participant.user_id);
                return (
                  <TableCell key={participant.user_id} align="center" sx={{ color: theme.palette.common.white, fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Всего очков">
                        <Chip label={`🏆 ${participantData?.totalPoints || 0}`} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: alpha(theme.palette.common.white, 0.2), color: theme.palette.common.white }} />
                      </Tooltip>
                      <Tooltip title="Точных прогнозов">
                        <Chip label={`🎯 ${participantData?.exactCount || 0}`} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: alpha(theme.palette.common.white, 0.2), color: theme.palette.common.white }} />
                      </Tooltip>
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {filteredMatches.map((match) => {
              const actualResult = match.is_finished && match.actual_home_score !== null
                ? { home: match.actual_home_score, away: match.actual_away_score }
                : null;
              
              return (
                <TableRow key={match.id} hover>
                  {/* Название матча */}
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 2, fontWeight: 600 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {match.home_team} — {match.away_team}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {match.home_team_code} — {match.away_team_code}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Chip label={`Тур ${match.round_number}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        <Chip label={new Date(match.match_date).toLocaleDateString('ru-RU')} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Результат матча */}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {actualResult ? (
                      <Chip
                        icon={<SoccerIcon />}
                        label={`${actualResult.home} : ${actualResult.away}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">— : —</Typography>
                    )}
                  </TableCell>
                  
                  {/* Прогнозы участников */}
                  {participants.map((participant) => {
                    const prediction = getPredictionForMatch(participant.user_id, match.id);
                    const bgColor = getCellColor(prediction, actualResult);
                    const points = actualResult && prediction ? getPointsForMatch(participant.user_id, match, actualResult) : 0;
                    
                    return (
                      <TableCell 
                        key={participant.user_id} 
                        align="center"
                        sx={{ 
                          bgcolor: bgColor,
                          transition: 'background-color 0.2s',
                          p: 1,
                        }}
                      >
                        {prediction ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {prediction.home_score} : {prediction.away_score}
                            </Typography>
                            {actualResult && points > 0 && (
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                +{points}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">— : —</Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Итоговая таблица мест */}
      <Paper sx={{ mt: 3, p: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          🏆 Итоговый рейтинг участников
        </Typography>
        <Grid container spacing={2}>
          {participantsRanking.map((participant, index) => (
            <Grid item xs={12} sm={6} md={4} key={participant.user_id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Box sx={{ width: 40, textAlign: 'center' }}>
                  {index < 3 ? (
                    <TrophyIcon sx={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32', fontSize: 28 }} />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {participant.display_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{participant.display_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {participant.predictionsCount} прогнозов • {participant.exactCount} точных
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {participant.totalPoints}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default PredictionsMatrixWithRanking;