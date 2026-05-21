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
  Grid,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
  Group as GroupIcon,
  EmojiEvents as PlayoffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';

const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) {
    return { points: 0, isExact: false, isExactDiff: false, isCorrectResult: false };
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

const StageStats = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('group');
  const [groupStats, setGroupStats] = useState([]);
  const [playoffStats, setPlayoffStats] = useState([]);
  const [hasGroupMatches, setHasGroupMatches] = useState(false);
  const [hasPlayoffMatches, setHasPlayoffMatches] = useState(false);
  const [groupMatchesCount, setGroupMatchesCount] = useState(0);
  const [playoffMatchesCount, setPlayoffMatchesCount] = useState(0);

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
        
        // Разделяем матчи по round_number (1-3 группа, 4+ плей-офф)
        const groupMatchesList = matchesData?.filter(m => m.round_number <= 3) || [];
        const playoffMatchesList = matchesData?.filter(m => m.round_number >= 4) || [];
        
        setHasGroupMatches(groupMatchesList.length > 0);
        setHasPlayoffMatches(playoffMatchesList.length > 0);
        setGroupMatchesCount(groupMatchesList.filter(m => m.is_finished).length);
        setPlayoffMatchesCount(playoffMatchesList.filter(m => m.is_finished).length);
        
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
        
        // Рассчитываем статистику отдельно для каждого этапа
        calculateStageStats(groupMatchesList, playoffMatchesList, participantsData, predictionsMap);
        
        // Если нет матчей плей-офф, показываем групповой этап
        if (playoffMatchesList.length === 0 && activeStage === 'playoff') {
          setActiveStage('group');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStageStats = (groupMatchesList, playoffMatchesList, participantsData, predictionsMap) => {
    const groupStatsList = [];
    const playoffStatsList = [];
    
    for (const participant of participantsData) {
      // Статистика группового этапа (только матчи с round_number 1-3)
      const groupStat = calculateParticipantStats(participant, groupMatchesList, predictionsMap);
      groupStatsList.push({ ...participant, ...groupStat });
      
      // Статистика плей-офф (только матчи с round_number 4+)
      const playoffStat = calculateParticipantStats(participant, playoffMatchesList, predictionsMap);
      playoffStatsList.push({ ...participant, ...playoffStat });
    }
    
    groupStatsList.sort((a, b) => b.totalPoints - a.totalPoints);
    playoffStatsList.sort((a, b) => b.totalPoints - a.totalPoints);
    
    setGroupStats(groupStatsList);
    setPlayoffStats(playoffStatsList);
  };

  const calculateParticipantStats = (participant, matchesList, predictionsMap) => {
    let totalPoints = 0;
    let exactCount = 0;
    let diffCount = 0;
    let resultCount = 0;
    let predictionsCount = 0;
    let possiblePoints = 0;
    let finishedMatches = 0;
    
    for (const match of matchesList) {
      if (match.is_finished && match.actual_home_score !== null) {
        finishedMatches++;
        possiblePoints += 3;
        
        const prediction = predictionsMap[participant.user_id]?.[match.id];
        if (prediction) {
          predictionsCount++;
          const actualResult = {
            home: match.actual_home_score,
            away: match.actual_away_score,
          };
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
    }
    
    const accuracy = possiblePoints > 0 ? Math.round((totalPoints / possiblePoints) * 100) : 0;
    
    return {
      totalPoints,
      exactCount,
      diffCount,
      resultCount,
      predictionsCount,
      possiblePoints,
      accuracy,
      matchesCount: finishedMatches,
    };
  };

  const renderStatsTable = (stats, title, icon, hasMatches, finishedMatchesCount) => {
    if (!hasMatches) {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Матчи этого этапа ещё не добавлены. Прогнозы появятся после добавления расписания.
        </Alert>
      );
    }
    
    if (finishedMatchesCount === 0) {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          На этом этапе пока нет завершённых матчей. Статистика появится после окончания матчей.
        </Alert>
      );
    }
    
    // Фильтруем участников, у которых есть прогнозы на этом этапе
    const filteredStats = stats.filter(s => s.matchesCount > 0);
    
    if (filteredStats.length === 0) {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Нет прогнозов на этом этапе. Сделайте прогнозы, чтобы увидеть статистику.
        </Alert>
      );
    }
    
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Chip label={`${filteredStats.length} участников`} size="small" />
          <Chip label={`${finishedMatchesCount} матчей`} size="small" variant="outlined" />
        </Box>
        
        <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell width={60} align="center">#</TableCell>
                <TableCell>Участник</TableCell>
                <TableCell align="center">Матчей</TableCell>
                <TableCell align="center">Прогнозов</TableCell>
                <TableCell align="center">🎯 Точных</TableCell>
                <TableCell align="center">📊 Разница</TableCell>
                <TableCell align="center">✅ Исход</TableCell>
                <TableCell align="center">🏆 Очки</TableCell>
                <TableCell align="center">📈 Точность</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStats.map((participant, index) => (
                <TableRow key={participant.user_id} hover>
                  <TableCell align="center">
                    {index < 3 ? (
                      <TrophyIcon sx={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }} />
                    ) : (
                      index + 1
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {participant.display_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500 }}>{participant.display_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{participant.matchesCount}</TableCell>
                  <TableCell align="center">{participant.predictionsCount}</TableCell>
                  <TableCell align="center">
                    <Chip label={participant.exactCount} size="small" color="success" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={participant.diffCount} size="small" color="warning" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={participant.resultCount} size="small" color="info" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {participant.totalPoints}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ minWidth: 100 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, height: 6, bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 3 }}>
                          <Box sx={{ width: `${participant.accuracy}%`, height: 6, bgcolor: 'primary.main', borderRadius: 3 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {participant.accuracy}%
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          📊 Статистика по этапам
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year} — групповой этап и плей-офф
        </Typography>
      </Box>

      {/* Общая информация */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{participants.length}</Typography>
            <Typography variant="caption" color="text.secondary">Участников</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {matches.filter(m => m.is_finished).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Сыграно матчей</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {groupStats.reduce((sum, s) => sum + s.exactCount, 0) + playoffStats.reduce((sum, s) => sum + s.exactCount, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Точных счетов</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {groupStats.reduce((sum, s) => sum + s.totalPoints, 0) + playoffStats.reduce((sum, s) => sum + s.totalPoints, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Всего очков</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Переключатель этапов */}
      <Tabs
        value={activeStage}
        onChange={(e, v) => setActiveStage(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          value="group" 
          label="🏆 Групповой этап" 
          icon={<GroupIcon />} 
          iconPosition="start"
          disabled={!hasGroupMatches}
        />
        <Tab 
          value="playoff" 
          label="🏆 Плей-офф" 
          icon={<PlayoffIcon />} 
          iconPosition="start"
          disabled={!hasPlayoffMatches}
        />
      </Tabs>

      {/* Таблица статистики выбранного этапа */}
      {activeStage === 'group' && renderStatsTable(groupStats, 'Групповой этап', <GroupIcon color="primary" />, hasGroupMatches, groupMatchesCount)}
      {activeStage === 'playoff' && renderStatsTable(playoffStats, 'Плей-офф', <PlayoffIcon color="secondary" />, hasPlayoffMatches, playoffMatchesCount)}

      {/* Легенда */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip icon={<ExactIcon />} label="Точный счёт — 3 очка" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }} />
        <Chip icon={<DiffIcon />} label="Разница голов — 2 очка" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }} />
        <Chip icon={<ResultIcon />} label="Угадан исход — 1 очко" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }} />
      </Box>
    </Box>
  );
};

export default StageStats;