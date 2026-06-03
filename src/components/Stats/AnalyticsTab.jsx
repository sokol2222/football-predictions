// src/components/Stats/AnalyticsTab.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Group as GroupIcon,
  EmojiEvents as PlayoffIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';

const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) return 0;
  
  const homeScore = prediction.home_score;
  const awayScore = prediction.away_score;
  const actualHome = actualResult.home;
  const actualAway = actualResult.away;
  
  if (homeScore === actualHome && awayScore === actualAway) return 3;
  if ((homeScore - awayScore) === (actualHome - actualAway)) return 2;
  
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  return getOutcome(homeScore, awayScore) === getOutcome(actualHome, actualAway) ? 1 : 0;
};

const AnalyticsTab = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [groupChartData, setGroupChartData] = useState([]);
  const [playoffChartData, setPlayoffChartData] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [playoffStats, setPlayoffStats] = useState([]);
  const [activeStage, setActiveStage] = useState('group');
  const [hasGroupMatches, setHasGroupMatches] = useState(false);
  const [hasPlayoffMatches, setHasPlayoffMatches] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      if (!tournamentData) return;
      
      const { data: matches } = await getMatches(tournamentData.id);
      const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
      setParticipants(participantsData);
      
      // Разделяем матчи по этапам
      const groupMatches = matches.filter(m => m.round_number <= 3);
      const playoffMatches = matches.filter(m => m.round_number >= 4);
      
      setHasGroupMatches(groupMatches.some(m => m.is_finished));
      setHasPlayoffMatches(playoffMatches.some(m => m.is_finished));
      
      // Загружаем прогнозы для всех участников
      const allPredictions = {};
      for (const participant of participantsData) {
        const { data: userPredictions } = await getUserPredictionsForTournament(
          participant.user_id,
          tournamentData.id
        );
        const predictionsMap = {};
        userPredictions?.forEach(p => {
          predictionsMap[p.match_id] = p;
        });
        allPredictions[participant.user_id] = predictionsMap;
      }
      
      // Анализируем групповой этап
      await analyzeStage(groupMatches, participantsData, allPredictions, 'group');
      
      // Анализируем плей-офф
      await analyzeStage(playoffMatches, participantsData, allPredictions, 'playoff');
      
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeStage = async (matchesList, participantsData, allPredictions, stage) => {
    // Получаем уникальные туры этапа
    const finishedRounds = [...new Set(
      matchesList.filter(m => m.is_finished && m.actual_home_score !== null)
        .map(m => m.round_number)
    )].sort((a, b) => a - b);
    
    if (finishedRounds.length === 0) {
      if (stage === 'group') {
        setGroupChartData([]);
        setGroupStats([]);
      } else {
        setPlayoffChartData([]);
        setPlayoffStats([]);
      }
      return;
    }
    
    // Рассчитываем накопление очков
    const history = [];
    let cumulativePoints = {};
    participantsData.forEach(p => { cumulativePoints[p.user_id] = 0; });
    
    // Рассчитываем статистику участников
    const statsMap = {};
    participantsData.forEach(p => {
      statsMap[p.user_id] = { 
        exactCount: 0, 
        diffCount: 0, 
        resultCount: 0, 
        totalPoints: 0, 
        matchesCount: 0, 
        pointsByRound: {} 
      };
    });
    
    for (const round of finishedRounds) {
      const roundMatches = matchesList.filter(m => m.round_number === round && m.is_finished);
      
      for (const match of roundMatches) {
        const actualResult = {
          home: match.actual_home_score,
          away: match.actual_away_score,
        };
        
        for (const participant of participantsData) {
          const prediction = allPredictions[participant.user_id]?.[match.id];
          if (prediction) {
            const points = calculatePoints(prediction, actualResult);
            cumulativePoints[participant.user_id] += points;
            
            statsMap[participant.user_id].pointsByRound[round] = 
              (statsMap[participant.user_id].pointsByRound[round] || 0) + points;
            
            if (points === 3) statsMap[participant.user_id].exactCount++;
            else if (points === 2) statsMap[participant.user_id].diffCount++;
            else if (points === 1) statsMap[participant.user_id].resultCount++;
            statsMap[participant.user_id].totalPoints += points;
            statsMap[participant.user_id].matchesCount++;
          }
        }
      }
      
      // Используем getStageLabel из утилиты
      const snapshot = { 
        stage: getStageLabel(round),
        round: round
      };
      participantsData.forEach(p => {
        snapshot[p.display_name] = cumulativePoints[p.user_id];
      });
      history.push(snapshot);
    }
    
    // Формируем статистику участников
    const statsList = participantsData.map(p => ({
      ...p,
      ...statsMap[p.user_id],
    })).sort((a, b) => b.totalPoints - a.totalPoints);
    
    if (stage === 'group') {
      setGroupChartData(history);
      setGroupStats(statsList);
    } else {
      setPlayoffChartData(history);
      setPlayoffStats(statsList);
    }
  };

  const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2', '#558b2f'];
  const currentChartData = activeStage === 'group' ? groupChartData : playoffChartData;
  const currentStats = activeStage === 'group' ? groupStats : playoffStats;
  const currentHasMatches = activeStage === 'group' ? hasGroupMatches : hasPlayoffMatches;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentHasMatches || currentChartData.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {activeStage === 'group' 
            ? 'Матчи группового этапа ещё не завершены' 
            : 'Матчи плей-офф ещё не проводились'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
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
        />
        <Tab 
          value="playoff" 
          label="🏆 Плей-офф" 
          icon={<PlayoffIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* График динамики очков */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          📈 Накопление очков по турам {activeStage === 'group' ? '(групповой этап)' : '(плей-офф)'}
        </Typography>
        
        <Box sx={{ 
          width: '100%', 
          overflowX: 'auto',
          '& .recharts-wrapper': {
            minWidth: currentChartData.length > 8 ? `${currentChartData.length * 80}px` : '100%',
          }
        }}>
          <ResponsiveContainer 
            width={currentChartData.length > 8 ? `${currentChartData.length * 80}px` : '100%'} 
            height={450}
          >
            <LineChart 
              data={currentChartData} 
              margin={{ top: 20, right: 80, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                label={{ value: 'Этап', position: 'insideBottomRight', offset: -5 }}
                interval={0}
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                label={{ value: 'Очки', angle: -90, position: 'insideLeft' }}
                domain={[0, 'auto']}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={{ 
                  paddingLeft: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, auto))',
                  gap: '8px'
                }}
              />
              {currentStats.map((p, idx) => (
                <Line
                  key={p.user_id}
                  type="monotone"
                  dataKey={p.display_name}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Таблица очков по турам */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        📊 Очки по турам {activeStage === 'group' ? '(групповой этап)' : '(плей-офф)'}
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableCell>Участник</TableCell>
              {currentChartData.map((data, idx) => (
                <TableCell key={idx} align="center">{data.stage}</TableCell>
              ))}
              <TableCell align="center">Всего</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentStats.map((p) => (
              <TableRow key={p.user_id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{p.display_name}</TableCell>
                {currentChartData.map((data, idx) => {
                  const roundPoints = p.pointsByRound?.[data.round] || 0;
                  return (
                    <TableCell key={idx} align="center">
                      {roundPoints}
                    </TableCell>
                  );
                })}
                <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {p.totalPoints}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Карточки прогресса участников */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        👥 Рейтинг участников {activeStage === 'group' ? '(групповой этап)' : '(плей-офф)'}
      </Typography>
      <Grid container spacing={2}>
        {currentStats.map((p, idx) => (
          <Grid item xs={12} sm={6} md={4} key={p.user_id}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: colors[idx % colors.length] }}>
                  {p.display_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {p.display_name}
                    {idx === 0 && <span style={{ marginLeft: 8 }}>🏆</span>}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Очки: {p.totalPoints}
                  </Typography>
                </Box>
                <Chip
                  label={`${p.matchesCount > 0 ? Math.round(p.totalPoints / (p.matchesCount * 3) * 100) : 0}%`}
                  size="small"
                  color={p.totalPoints / (p.matchesCount * 3) > 0.5 ? 'success' : 'default'}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip label={`🎯 Точных: ${p.exactCount}`} size="small" color="success" variant="outlined" />
                <Chip label={`📊 Разниц: ${p.diffCount}`} size="small" color="warning" variant="outlined" />
                <Chip label={`✅ Исходов: ${p.resultCount}`} size="small" color="info" variant="outlined" />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AnalyticsTab;