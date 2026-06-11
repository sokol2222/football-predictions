// src/components/Stats/MatchStats.jsx
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
  Alert,
  Tooltip,
} from '@mui/material';
import {
  SportsSoccer as SoccerIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  PlayArrow as LiveIcon,
  EmojiEvents as FinishedIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getParticipantPredictions, isRoundOpen } from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';

// Функция для получения очков по прогнозу
const getPredictionPoints = (predictionStr, actualResult) => {
  if (!actualResult) {
    return { points: null, label: '', color: 'transparent', tooltip: 'Матч не завершён' };
  }
  
  if (!predictionStr || predictionStr === '—') {
    return { points: 0, label: '0', color: '#9e9e9e', tooltip: 'Нет прогноза' };
  }
  
  const parts = predictionStr.split(':');
  const homeScore = parseInt(parts[0]);
  const awayScore = parseInt(parts[1]);
  const actualHome = actualResult.home;
  const actualAway = actualResult.away;
  
  if (homeScore === actualHome && awayScore === actualAway) {
    return { points: 3, label: '+3', color: '#4caf50', tooltip: 'Точный счёт! +3 очка' };
  }
  
  if ((homeScore - awayScore) === (actualHome - actualAway)) {
    return { points: 2, label: '+2', color: '#ff9800', tooltip: 'Угадана разница голов! +2 очка' };
  }
  
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  if (getOutcome(homeScore, awayScore) === getOutcome(actualHome, actualAway)) {
    return { points: 1, label: '+1', color: '#2196f3', tooltip: 'Угадан исход! +1 очко' };
  }
  
  return { points: 0, label: '0', color: '#f44336', tooltip: 'Мимо! 0 очков' };
};

// Компонент статуса матча
const MatchStatus = ({ match }) => {
  if (match.is_finished) {
    return (
      <Tooltip title="Матч завершён">
        <Chip icon={<FinishedIcon />} label="Завершён" size="small" color="success" sx={{ fontWeight: 600 }} />
      </Tooltip>
    );
  }
  
  const now = new Date();
  const matchDateTime = new Date(`${match.match_date}T${match.match_time}`);
  
  if (now > matchDateTime) {
    return (
      <Tooltip title="Матч идёт или уже завершился">
        <Chip icon={<LiveIcon />} label="В эфире" size="small" color="warning" sx={{ fontWeight: 600 }} />
      </Tooltip>
    );
  }
  
  return (
    <Tooltip title={`Матч состоится ${new Date(match.match_date).toLocaleDateString()} в ${match.match_time?.slice(0, 5)}`}>
      <Chip icon={<ScheduleIcon />} label="Запланирован" size="small" variant="outlined" />
    </Tooltip>
  );
};

const MatchStats = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [allPredictions, setAllPredictions] = useState({});
  const [roundsStatus, setRoundsStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null);
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
        
        const statusMap = {};
        for (const round of uniqueRounds) {
          const status = await isRoundOpen(tournamentData.id, round);
          statusMap[round] = status;
        }
        setRoundsStatus(statusMap);
        
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        const predictionsMap = {};
        for (const participant of participantsData) {
          const { data: userPredictions } = await getParticipantPredictions(participant, tournamentData.id);
          
          const userPredictionsMap = {};
          userPredictions?.forEach(p => {
            userPredictionsMap[p.match_id] = p;
          });
          const key = participant.user_id || participant.display_name;
          predictionsMap[key] = userPredictionsMap;
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

  const canShowPredictions = (match) => {
    if (match.is_finished) return true;
    const roundStatus = roundsStatus[match.round_number];
    if (roundStatus && !roundStatus.is_open) return true;
    return false;
  };

  const getPredictionForMatch = (participant, matchId, match) => {
    if (!canShowPredictions(match)) return null;
    const key = participant.user_id || participant.display_name;
    return allPredictions[key]?.[matchId] || null;
  };

  const filteredMatches = useMemo(() => {
    if (selectedRound === 'all') return matches;
    return matches.filter(m => m.round_number === selectedRound);
  }, [matches, selectedRound]);

  const getAllMatchesPredictions = () => {
    const result = [];
    
    for (const match of filteredMatches) {
      const showPredictions = canShowPredictions(match);
      const actualResult = match.is_finished && match.actual_home_score !== null
        ? { home: match.actual_home_score, away: match.actual_away_score }
        : null;
      
      const matchPredictions = [];
      for (const participant of participants) {
        const prediction = showPredictions 
          ? getPredictionForMatch(participant, match.id, match)
          : null;
        
        matchPredictions.push({
          participantName: participant.display_name,
          participantId: participant.user_id,
          prediction: prediction ? `${prediction.home_score}:${prediction.away_score}` : null,
          isHidden: !showPredictions || !prediction,
        });
      }
      
      result.push({
        matchId: match.id,
        matchName: `${match.home_team} — ${match.away_team}`,
        matchNumber: match.match_number,
        round: match.round_number,
        date: match.match_date,
        time: match.match_time,
        actualResult: actualResult ? { home: actualResult.home, away: actualResult.away } : null,
        actualResultStr: actualResult ? `${actualResult.home}:${actualResult.away}` : null,
        isFinished: match.is_finished,
        showPredictions,
        match,
        predictions: matchPredictions,
      });
    }
    
    return result;
  };

  const getSingleMatchPredictions = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match) return { predictionsList: [], showPredictions: false };
    
    const showPredictions = canShowPredictions(match);
    const actualResult = match.is_finished && match.actual_home_score !== null
      ? { home: match.actual_home_score, away: match.actual_away_score }
      : null;
    
    const predictionsList = [];
    for (const participant of participants) {
      const prediction = showPredictions 
        ? getPredictionForMatch(participant, match.id, match)
        : null;
      
      predictionsList.push({
        participantName: participant.display_name,
        participantId: participant.user_id,
        prediction: prediction ? `${prediction.home_score}:${prediction.away_score}` : null,
        isHidden: !showPredictions || !prediction,
      });
    }
    
    predictionsList.sort((a, b) => {
      if (a.isHidden && !b.isHidden) return 1;
      if (!a.isHidden && b.isHidden) return -1;
      return 0;
    });
    
    return { match, predictionsList, actualResult, showPredictions };
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
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
        📊 Статистика по матчам
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Прогнозы участников — все матчи или выборочно
      </Typography>

      <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3, borderRadius: 2 }}>
        Прогнозы скрыты до окончания дедлайна тура. После дедлайна все прогнозы становятся видны.
      </Alert>

      <Tabs value={viewMode} onChange={(e, v) => setViewMode(v)} sx={{ mb: 3 }}>
        <Tab value="all" label="📋 Все матчи" />
        <Tab value="single" label="🎯 Один матч" />
      </Tabs>

      {viewMode === 'all' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
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
                    {rounds.map(round => {
                      const roundStatus = roundsStatus[round];
                      const isOpen = roundStatus?.is_open;
                      return (
                        <MenuItem key={round} value={round}>
                          {getStageLabel(round)} ({matches.filter(m => m.round_number === round).length} матчей)
                          {isOpen ? ' 🔒' : ' 🔓'}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Матч</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Статус</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Результат</TableCell>
                  {participants.map((p, idx) => (
                    <TableCell key={p.user_id || `header-${idx}`} sx={{ color: 'white', fontWeight: 700 }} align="center">
                      {p.display_name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allMatchesData.map((matchData) => {
                  const actualResult = matchData.actualResult;
                  
                  return (
                    <TableRow key={matchData.matchId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {matchData.matchName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getStageLabel(matchData.round)} • {new Date(matchData.date).toLocaleDateString()} {matchData.time?.slice(0, 5)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <MatchStatus match={matchData.match} />
                      </TableCell>
                      <TableCell align="center">
                        {matchData.actualResultStr ? (
                          <Chip
                            icon={<SoccerIcon />}
                            label={matchData.actualResultStr}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">— : —</Typography>
                        )}
                      </TableCell>
                      {matchData.predictions.map((pred, idx) => {
                        const predictionStr = pred.prediction;
                        const { label, color, tooltip } = getPredictionPoints(predictionStr, actualResult);
                        const isHidden = pred.isHidden;
                        
                        return (
                          <TableCell 
                            key={pred.participantId || `cell-${matchData.matchId}-${idx}`}
                            align="center"
                            sx={{ p: 1 }}
                          >
                            {isHidden ? (
                              <Chip icon={<LockIcon />} label="🔒" size="small" variant="outlined" />
                            ) : (
                              <Tooltip title={tooltip} arrow placement="top">
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {predictionStr || '—'}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      fontWeight: 700, 
                                      color: color,
                                      minWidth: 28,
                                    }}
                                  >
                                    {label}
                                  </Typography>
                                </Box>
                              </Tooltip>
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

          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#4caf50' }}>+3</Typography>
              <Typography variant="caption">Точный счёт</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff9800' }}>+2</Typography>
              <Typography variant="caption">Разница голов</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2196f3' }}>+1</Typography>
              <Typography variant="caption">Исход</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f44336' }}>0</Typography>
              <Typography variant="caption">Не угадал</Typography>
            </Box>
          </Box>
        </>
      )}

      {viewMode === 'single' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Выберите матч</InputLabel>
                  <Select
                    value={selectedMatch || ''}
                    onChange={(e) => setSelectedMatch(e.target.value)}
                    label="Выберите матч"
                  >
                    {matches.map((match) => {
                      const showPredictions = canShowPredictions(match);
                      return (
                        <MenuItem key={match.id} value={match.id}>
                          {match.home_team} — {match.away_team}
                          {match.is_finished ? ' ✅' : showPredictions ? ' 🔓' : ' 🔒'}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                {singleMatchData.match && (
                  <Box sx={{ textAlign: 'right', display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <MatchStatus match={singleMatchData.match} />
                    {singleMatchData.actualResult && (
                      <Chip
                        icon={<SoccerIcon />}
                        label={`Результат: ${singleMatchData.actualResult.home}:${singleMatchData.actualResult.away}`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell width={50}>#</TableCell>
                  <TableCell>Участник</TableCell>
                  <TableCell align="center" width={150}>Прогноз</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {singleMatchData.predictionsList?.map((pred, index) => {
                  const actualResult = singleMatchData.actualResult;
                  const predictionStr = pred.prediction;
                  const { label, color, tooltip } = getPredictionPoints(predictionStr, actualResult);
                  const isHidden = pred.isHidden;
                  
                  return (
                    <TableRow key={pred.participantId || `single-${index}`} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                            {pred.participantName?.charAt(0).toUpperCase() || '?'}
                          </Avatar>
                          <Typography variant="body2">{pred.participantName || '?'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {isHidden ? (
                          <Chip icon={<LockIcon />} label="Скрыто" size="small" variant="outlined" />
                        ) : (
                          <Tooltip title={tooltip} arrow placement="top">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip 
                                label={predictionStr || '—'} 
                                size="small" 
                                variant="outlined"
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 700, 
                                  color: color,
                                  minWidth: 28,
                                }}
                              >
                                {label}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default MatchStats;