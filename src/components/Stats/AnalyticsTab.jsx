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
  Alert,
} from '@mui/material';
import {
  Group as GroupIcon,
  EmojiEvents as PlayoffIcon,
  ShowChart as ChartIcon,
  Dashboard as DashboardIcon,
  Info as InfoIcon,
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
import { supabase } from '../../lib/supabase';
import PointsProgressChart from './PointsProgressChart';

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

// ============================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
// ============================================================

const getStageType = (roundNumber) => {
  if (roundNumber < 4) return 'group';
  if (roundNumber >= 4 && roundNumber <= 8) return 'playoff';
  return 'group';
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

const AnalyticsTab = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [groupChartData, setGroupChartData] = useState([]);
  const [playoffChartData, setPlayoffChartData] = useState([]);
  const [totalChartData, setTotalChartData] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [playoffStats, setPlayoffStats] = useState([]);
  const [totalStats, setTotalStats] = useState([]);
  const [activeStage, setActiveStage] = useState('group');
  const [activeChartLib, setActiveChartLib] = useState('recharts');
  const [tournamentId, setTournamentId] = useState(null);
  const [allMatches, setAllMatches] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      if (!tournamentData) {
        setLoading(false);
        return;
      }
      
      setTournamentId(tournamentData.id);
      
      const { data: matches } = await getMatches(tournamentData.id);
      setAllMatches(matches || []);
      
      const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
      setParticipants(participantsData || []);
      
      // Чёткое разделение по этапам
      const groupMatches = (matches || []).filter(m => getStageType(m.round_number) === 'group');
      const playoffMatches = (matches || []).filter(m => getStageType(m.round_number) === 'playoff');
      
      // Загружаем прогнозы для всех участников
      const allPredictions = {};
      for (const participant of participantsData || []) {
        let userPredictions = [];
        
        if (participant.user_id) {
          const { data } = await getUserPredictionsForTournament(participant.user_id, tournamentData.id);
          userPredictions = data || [];
        } else if (participant.display_name) {
          const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('friend_name', participant.display_name)
            .eq('tournament_id', tournamentData.id);
          
          if (!error) {
            userPredictions = data || [];
          }
        }
        
        const predictionsMap = {};
        userPredictions?.forEach(p => {
          predictionsMap[p.match_id] = p;
        });
        const key = participant.user_id || participant.display_name;
        allPredictions[key] = predictionsMap;
      }
      
      // Анализируем групповой этап
      const groupResult = analyzeStage(groupMatches, participantsData || [], allPredictions);
      setGroupChartData(groupResult.chartData);
      setGroupStats(groupResult.statsList);
      
      // Анализируем плей-офф
      const playoffResult = analyzeStage(playoffMatches, participantsData || [], allPredictions);
      setPlayoffChartData(playoffResult.chartData);
      setPlayoffStats(playoffResult.statsList);
      
      // Анализируем общее (все матчи)
      const totalResult = analyzeStage(matches || [], participantsData || [], allPredictions);
      setTotalChartData(totalResult.chartData);
      setTotalStats(totalResult.statsList);
      
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeStage = (matchesList, participantsData, allPredictions) => {
    // БЕРЁМ ВСЕ УНИКАЛЬНЫЕ ТУРЫ (даже без завершённых матчей)
    const rounds = [...new Set(
      matchesList.map(m => m.round_number)
    )].sort((a, b) => a - b);
    
    if (rounds.length === 0) {
      return { chartData: [], statsList: [] };
    }
    
    const history = [];
    let cumulativePoints = {};
    participantsData.forEach(p => { 
      const key = p.user_id || p.display_name;
      cumulativePoints[key] = 0; 
    });
    
    const statsMap = {};
    participantsData.forEach(p => {
      const key = p.user_id || p.display_name;
      statsMap[key] = { 
        exactCount: 0, 
        diffCount: 0, 
        resultCount: 0, 
        totalPoints: 0, 
        matchesCount: 0, 
        pointsByRound: {},
        display_name: p.display_name,
      };
    });
    
    for (const round of rounds) {
      const roundMatches = matchesList.filter(m => m.round_number === round);
      
      // Сначала проверяем, есть ли завершённые матчи в этом туре
      const hasFinishedMatches = roundMatches.some(m => m.is_finished && m.actual_home_score !== null);
      
      for (const match of roundMatches) {
        const isFinished = match.is_finished && match.actual_home_score !== null;
        const actualResult = isFinished ? {
          home: match.actual_home_score,
          away: match.actual_away_score,
        } : null;
        
        for (const participant of participantsData) {
          const key = participant.user_id || participant.display_name;
          const prediction = allPredictions[key]?.[match.id];
          
          if (prediction && isFinished) {
            const points = calculatePoints(prediction, actualResult);
            cumulativePoints[key] += points;
            
            statsMap[key].pointsByRound[round] = 
              (statsMap[key].pointsByRound[round] || 0) + points;
            
            if (points === 3) statsMap[key].exactCount++;
            else if (points === 2) statsMap[key].diffCount++;
            else if (points === 1) statsMap[key].resultCount++;
            statsMap[key].totalPoints += points;
            statsMap[key].matchesCount++;
          }
        }
      }
      
      const snapshot = { 
        stage: getStageLabel(round),
        round: round,
        has_finished: hasFinishedMatches,
      };
      
      participantsData.forEach(p => {
        const key = p.user_id || p.display_name;
        snapshot[p.display_name] = cumulativePoints[key] || 0;
      });
      history.push(snapshot);
    }
    
    const statsList = participantsData.map(p => {
      const key = p.user_id || p.display_name;
      return {
        ...p,
        ...statsMap[key],
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
    
    return { chartData: history, statsList };
  };

  const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2', '#558b2f'];
  
  // Получение текущих данных в зависимости от вкладки
  const getCurrentData = () => {
    if (activeStage === 'group') {
      return { chartData: groupChartData, stats: groupStats };
    } else if (activeStage === 'playoff') {
      return { chartData: playoffChartData, stats: playoffStats };
    } else {
      return { chartData: totalChartData, stats: totalStats };
    }
  };

  const { chartData: currentChartData, stats: currentStats } = getCurrentData();
  
  // Проверяем, есть ли матчи в выбранном этапе
  const hasAnyMatches = allMatches.length > 0;
  const hasStageMatches = currentChartData.length > 0;
  const hasFinishedInStage = currentChartData.some(item => item.has_finished);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAnyMatches) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Нет матчей для отображения
        </Typography>
      </Paper>
    );
  }

  if (!hasStageMatches) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {activeStage === 'group' 
            ? 'Матчи группового этапа ещё не добавлены' 
            : activeStage === 'playoff' 
            ? 'Матчи плей-офф ещё не добавлены'
            : 'Нет матчей для отображения'}
        </Typography>
      </Paper>
    );
  }

  const getStageTitle = () => {
    if (activeStage === 'group') return 'групповом этапе';
    if (activeStage === 'playoff') return 'плей-офф';
    return 'турнире';
  };

  return (
    <Box>
      {/* Переключатель этапов */}
      <Tabs
        value={activeStage}
        onChange={(e, v) => setActiveStage(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="fullWidth"
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
        <Tab 
          value="total" 
          label="📊 Общее" 
          icon={<DashboardIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* Информационное сообщение, если нет завершённых матчей */}
      {!hasFinishedInStage && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          На {getStageTitle()} пока нет завершённых матчей. График показывает структуру матчей, очки появятся после завершения матчей.
        </Alert>
      )}

      {/* Переключатель библиотек графиков */}
      <Paper sx={{ mb: 3, p: 1, borderRadius: 2 }}>
        <Tabs
          value={activeChartLib}
          onChange={(e, v) => setActiveChartLib(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.875rem',
            }
          }}
        >
          <Tab 
            value="recharts" 
            label="📊 По турам" 
            icon={<ChartIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="chartjs" 
            label="📊 По матчам" 
            icon={<ChartIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* ============================================================ */}
      {/* ГРАФИК НА RECHARTS */}
      {/* ============================================================ */}
      {activeChartLib === 'recharts' && (
        <>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              📈 Накопление очков по турам {activeStage === 'group' ? '(групповой этап)' : activeStage === 'playoff' ? '(плей-офф)' : '(весь турнир)'}
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
                      key={p.user_id || p.display_name}
                      type="monotone"
                      dataKey={p.display_name}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Таблица очков по турам */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            📊 Очки по турам {activeStage === 'group' ? '(групповой этап)' : activeStage === 'playoff' ? '(плей-офф)' : '(весь турнир)'}
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell>Участник</TableCell>
                  {currentChartData.map((data, idx) => (
                    <TableCell key={idx} align="center">
                      {data.stage}
                      {!data.has_finished && (
                        <Chip label="⏳" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="center">Всего</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentStats.map((p) => (
                  <TableRow key={p.user_id || p.display_name} hover>
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
            👥 Рейтинг участников {activeStage === 'group' ? '(групповой этап)' : activeStage === 'playoff' ? '(плей-офф)' : '(весь турнир)'}
          </Typography>
          <Grid container spacing={2}>
            {currentStats.map((p, idx) => (
              <Grid item xs={12} sm={6} md={4} key={p.user_id || p.display_name}>
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
        </>
      )}

      {/* ============================================================ */}
      {/* ГРАФИК НА CHART.JS */}
      {/* ============================================================ */}
      {activeChartLib === 'chartjs' && (
        <PointsProgressChart 
          tournamentId={tournamentId}
          initialParticipants={participants.map(p => p.display_name)}
        />
      )}
    </Box>
  );
};

export default AnalyticsTab;