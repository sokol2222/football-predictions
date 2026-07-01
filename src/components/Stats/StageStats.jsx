import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Grid,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  EmojiEvents as PlayoffIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';
import AnalyticsTab from './AnalyticsTab';

const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) {
    return { points: 0, isExact: false, isExactDiff: false, isCorrectResult: false };
  }
  
  const homeScore = prediction.homeScore || prediction.home_score || 0;
  const awayScore = prediction.awayScore || prediction.away_score || 0;
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

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

const getStageType = (roundNumber) => {
  if (roundNumber < 4) return 'group';
  if (roundNumber >= 4 && roundNumber <= 8) return 'playoff';
  return 'group';
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

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
  const [totalStats, setTotalStats] = useState([]);
  const [hasGroupMatches, setHasGroupMatches] = useState(false);
  const [hasPlayoffMatches, setHasPlayoffMatches] = useState(false);
  const [groupMatchesCount, setGroupMatchesCount] = useState(0);
  const [playoffMatchesCount, setPlayoffMatchesCount] = useState(0);
  const [totalMatchesCount, setTotalMatchesCount] = useState(0);

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
        
        // Разделяем матчи по этапам
        const groupMatchesList = matchesData?.filter(m => getStageType(m.round_number) === 'group') || [];
        const playoffMatchesList = matchesData?.filter(m => getStageType(m.round_number) === 'playoff') || [];
        const allMatchesList = matchesData || [];
        
        setHasGroupMatches(groupMatchesList.length > 0);
        setHasPlayoffMatches(playoffMatchesList.length > 0);
        setGroupMatchesCount(groupMatchesList.filter(m => m.is_finished).length);
        setPlayoffMatchesCount(playoffMatchesList.filter(m => m.is_finished).length);
        setTotalMatchesCount(allMatchesList.filter(m => m.is_finished).length);
        
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        // Загружаем прогнозы для всех участников
        const predictionsMap = {};
        for (const participant of participantsData) {
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
          
          const userPredictionsMap = {};
          userPredictions?.forEach(p => {
            userPredictionsMap[p.match_id] = p;
          });
          
          const key = participant.user_id || participant.display_name;
          predictionsMap[key] = userPredictionsMap;
        }
        setAllPredictions(predictionsMap);
        
        calculateStats(groupMatchesList, playoffMatchesList, allMatchesList, participantsData, predictionsMap);
        
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

  const calculateStats = (groupMatchesList, playoffMatchesList, allMatchesList, participantsData, predictionsMap) => {
    const groupStatsList = [];
    const playoffStatsList = [];
    const totalStatsList = [];
    
    for (const participant of participantsData) {
      const groupStat = calculateParticipantStats(participant, groupMatchesList, predictionsMap);
      groupStatsList.push({ ...participant, ...groupStat });
      
      const playoffStat = calculateParticipantStats(participant, playoffMatchesList, predictionsMap);
      playoffStatsList.push({ ...participant, ...playoffStat });
      
      const totalStat = calculateParticipantStats(participant, allMatchesList, predictionsMap);
      totalStatsList.push({ ...participant, ...totalStat });
    }
    
    groupStatsList.sort((a, b) => b.totalPoints - a.totalPoints);
    playoffStatsList.sort((a, b) => b.totalPoints - a.totalPoints);
    totalStatsList.sort((a, b) => b.totalPoints - a.totalPoints);
    
    setGroupStats(groupStatsList);
    setPlayoffStats(playoffStatsList);
    setTotalStats(totalStatsList);
  };

  const calculateParticipantStats = (participant, matchesList, predictionsMap) => {
    let totalPoints = 0;
    let exactCount = 0;
    let diffCount = 0;
    let resultCount = 0;
    let predictionsCount = 0;
    let finishedMatches = 0;
    
    const predictionKey = participant.user_id || participant.display_name;
    
    for (const match of matchesList) {
      if (match.is_finished && match.actual_home_score !== null) {
        finishedMatches++;
        
        const prediction = predictionsMap[predictionKey]?.[match.id];
        if (prediction) {
          predictionsCount++;
          const actualResult = {
            home: match.actual_home_score,
            away: match.actual_away_score,
          };
          const pointsData = calculatePoints(prediction, actualResult);
          
          totalPoints += pointsData.points;
          if (pointsData.isExact) exactCount++;
          if (pointsData.isExactDiff) diffCount++;
          if (pointsData.isCorrectResult) resultCount++;
        }
      }
    }
    
    const accuracy = finishedMatches > 0 ? Math.round((totalPoints / (finishedMatches * 3)) * 100) : 0;
    
    return {
      totalPoints,
      exactCount,
      diffCount,
      resultCount,
      predictionsCount,
      accuracy,
      matchesCount: finishedMatches,
    };
  };

  // ============================================================
  // КОЛОНКИ ДЛЯ ТАБЛИЦЫ
  // ============================================================
  
  const columns = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: '#',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => {
          const index = row.index;
          return index < 3 ? (
            <TrophyIcon sx={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }} />
          ) : (
            index + 1
          );
        },
      },
      {
        accessorKey: 'display_name',
        header: 'Участник',
        size: 200,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {row.original.display_name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography sx={{ fontWeight: 500 }}>{row.original.display_name}</Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'matchesCount',
        header: 'Матчей',
        size: 80,
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: 'predictionsCount',
        header: 'Прогнозов',
        size: 100,
        Cell: ({ cell }) => cell.getValue() || 0,
      },
      {
        accessorKey: 'exactCount',
        header: '🎯 Точных',
        size: 100,
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 0} size="small" color="success" variant="primary" />
        ),
      },
      {
        accessorKey: 'diffCount',
        header: '📊 Разница',
        size: 100,
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 0} size="small" color="warning" variant="secondary" />
        ),
      },
      {
        accessorKey: 'resultCount',
        header: '✅ Исход',
        size: 100,
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 0} size="small" color="info" variant="secondary" />
        ),
      },
      {
        accessorKey: 'totalPoints',
        header: '🏆 Очки',
        size: 80,
        Cell: ({ cell }) => (
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {cell.getValue() || 0}
          </Typography>
        ),
      },
      {
        accessorKey: 'accuracy',
        header: '📈 Точность',
        size: 120,
        Cell: ({ cell }) => {
          const accuracy = cell.getValue() || 0;
          return (
            <Box sx={{ minWidth: 100 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={accuracy}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {accuracy}%
                </Typography>
              </Box>
            </Box>
          );
        },
      },
    ],
    [theme]
  );

  // ============================================================
  // СОЗДАНИЕ ТАБЛИЦЫ
  // ============================================================
  
  const getCurrentStats = () => {
    if (activeStage === 'group') return groupStats;
    if (activeStage === 'playoff') return playoffStats;
    return totalStats;
  };

  const getCurrentMatchesCount = () => {
    if (activeStage === 'group') return groupMatchesCount;
    if (activeStage === 'playoff') return playoffMatchesCount;
    return totalMatchesCount;
  };

  const getCurrentHasMatches = () => {
    if (activeStage === 'group') return hasGroupMatches;
    if (activeStage === 'playoff') return hasPlayoffMatches;
    return true;
  };

  const table = useMaterialReactTable({
    columns,
    data: getCurrentStats(),
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageSize: 15 },
      sorting: [{ id: 'totalPoints', desc: true }],
      density: 'compact',
    },
    state: { isLoading: loading },
    density: 'compact',
    enableRowNumbers: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enableDensityToggle: true,
    localization: {
      search: 'Поиск',
      clearSearch: 'Очистить',
      rowsPerPage: 'Строк',
      showAll: 'Все',
      all: 'Все',
    },
    layoutMode: 'semantic',
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100vh - 200px)',
        overflowX: 'auto',
        overflowY: 'auto',
      },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: { 
        borderRadius: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        overflow: 'hidden',
        width: '100%',
      },
    },
    muiTableHeadCellProps: {
      sx: { 
        fontWeight: 700, 
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        whiteSpace: 'nowrap',
        py: 1,
        px: 1,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        whiteSpace: 'nowrap',
        py: 0.5,
        px: 1,
      },
    },
  });

  // ============================================================
  // РЕНДЕР
  // ============================================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentStats = getCurrentStats();
  const currentMatchesCount = getCurrentMatchesCount();
  const currentHasMatches = getCurrentHasMatches();
  
  const title = activeStage === 'group' ? 'Групповой этап' 
    : activeStage === 'playoff' ? 'Плей-офф' 
    : 'Общая статистика';
  
  const icon = activeStage === 'group' ? <GroupIcon color="primary" /> 
    : activeStage === 'playoff' ? <PlayoffIcon color="secondary" /> 
    : <DashboardIcon color="success" />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          📊 Статистика прогнозистов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year} — групповой этап, плей-офф и общая статистика
        </Typography>
      </Box>

      {/* Общая информация по выбранному этапу */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentStats.filter(s => s.matchesCount > 0).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Участников</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentMatchesCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">Сыграно матчей</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentStats.reduce((sum, s) => sum + s.exactCount, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Точных счетов</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentStats.reduce((sum, s) => sum + s.totalPoints, 0)}
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
        <Tab 
          value="total" 
          label="📊 Общее" 
          icon={<DashboardIcon />} 
          iconPosition="start"
        />
        <Tab 
          value="analytics" 
          label="📈 Динамика" 
          icon={<TrendingUpIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* Сообщение, если нет матчей */}
      {activeStage !== 'analytics' && !currentHasMatches && activeStage !== 'total' && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          {activeStage === 'group' 
            ? 'Матчи группового этапа ещё не добавлены.'
            : '🏆 Сетка плей-офф будет сформирована после завершения группового этапа.'}
        </Alert>
      )}

      {/* Сообщение, если нет завершённых матчей */}
      {activeStage !== 'analytics' && currentHasMatches && currentMatchesCount === 0 && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          На этом этапе пока нет завершённых матчей. Статистика появится после окончания матчей.
        </Alert>
      )}

      {/* Сообщение, если нет прогнозов */}
      {activeStage !== 'analytics' && currentHasMatches && currentMatchesCount > 0 && currentStats.filter(s => s.predictionsCount > 0).length === 0 && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Нет прогнозов на этом этапе. Сделайте прогнозы, чтобы увидеть статистику.
        </Alert>
      )}

      {/* Таблица */}
      {activeStage !== 'analytics' && currentHasMatches && currentMatchesCount > 0 && currentStats.filter(s => s.predictionsCount > 0).length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {icon}
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Chip label={`${currentStats.filter(s => s.predictionsCount > 0).length} участников`} size="small" />
            <Chip label={`${currentMatchesCount} матчей`} size="small" variant="outlined" />
          </Box>
          <MaterialReactTable table={table} />
        </>
      )}

      {/* Аналитика */}
      {activeStage === 'analytics' && <AnalyticsTab />}

      {/* Легенда */}
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
      </Box>
    </Box>
  );
};

export default StageStats;