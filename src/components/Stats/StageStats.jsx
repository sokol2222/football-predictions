import { useState, useEffect, useMemo } from 'react';
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
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
  Group as GroupIcon,
  EmojiEvents as PlayoffIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getTournamentParticipants, getUserPredictionsForTournament } from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';
import AnalyticsTab from './AnalyticsTab';

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
        
        calculateStats(groupMatchesList, playoffMatchesList, participantsData, predictionsMap);
        
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

  const calculateStats = (groupMatchesList, playoffMatchesList, participantsData, predictionsMap) => {
    const groupStatsList = [];
    const playoffStatsList = [];
    
    for (const participant of participantsData) {
      const groupStat = calculateParticipantStats(participant, groupMatchesList, predictionsMap);
      groupStatsList.push({ ...participant, ...groupStat });
      
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
    let finishedMatches = 0;
    
    for (const match of matchesList) {
      if (match.is_finished && match.actual_home_score !== null) {
        finishedMatches++;
        
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

  // Колонки для таблицы
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
          <Chip label={cell.getValue() || 0} size="small" color="success" variant="outlined" />
        ),
      },
      {
        accessorKey: 'diffCount',
        header: '📊 Разница',
        size: 100,
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 0} size="small" color="warning" variant="outlined" />
        ),
      },
      {
        accessorKey: 'resultCount',
        header: '✅ Исход',
        size: 100,
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 0} size="small" color="info" variant="outlined" />
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

  // Создаём таблицу
  const table = useMaterialReactTable({
  columns,
  data: activeStage === 'group' ? groupStats : playoffStats,
  enablePagination: true,
  enableSorting: true,
  enableColumnFilters: true,
  enableGlobalFilter: true,
  initialState: {
    pagination: { pageSize: 10 },
    sorting: [{ id: 'totalPoints', desc: true }],
    density: 'compact',  // 👈 Компактный режим
  },
  state: { isLoading: loading },
  // 👈 Включи компактный режим
  density: 'compact',
  enableRowNumbers: false,
  enableFullScreenToggle: false,
  enableHiding: false,
  enableDensityToggle: true,  // Пользователь сможет сам менять плотность
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
      py: 1,  // 👈 Уменьшенный padding
      px: 1,  // 👈 Уменьшенный padding
    },
  },
  muiTableBodyCellProps: {
    sx: {
      whiteSpace: 'nowrap',
      py: 0.5,  // 👈 Уменьшенный padding
      px: 1,    // 👈 Уменьшенный padding
    },
  },
});

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentStats = activeStage === 'group' ? groupStats : playoffStats;
  const hasMatches = activeStage === 'group' ? hasGroupMatches : hasPlayoffMatches;
  const finishedMatchesCount = activeStage === 'group' ? groupMatchesCount : playoffMatchesCount;
  const title = activeStage === 'group' ? 'Групповой этап' : 'Плей-офф';
  const icon = activeStage === 'group' ? <GroupIcon color="primary" /> : <PlayoffIcon color="secondary" />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          📊 Статистика прогнозистов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year} — групповой этап и плей-офф
        </Typography>
      </Box>

      {/* Общая информация */}
      {/* Общая информация по ВЫБРАННОМУ этапу, а не по всему турниру */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {activeStage === 'group' 
              ? groupStats.filter(s => s.matchesCount > 0).length 
              : playoffStats.filter(s => s.matchesCount > 0).length}
          </Typography>
          <Typography variant="caption" color="text.secondary">Участников</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {activeStage === 'group' ? groupMatchesCount : playoffMatchesCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">Сыграно матчей</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {activeStage === 'group' 
              ? groupStats.reduce((sum, s) => sum + s.exactCount, 0)
              : playoffStats.reduce((sum, s) => sum + s.exactCount, 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">Точных счетов</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {activeStage === 'group' 
              ? groupStats.reduce((sum, s) => sum + s.totalPoints, 0)
              : playoffStats.reduce((sum, s) => sum + s.totalPoints, 0)}
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
          value="analytics" 
          label="📊 Динамика" 
          icon={<TrendingUpIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {/* Сообщение, если нет матчей */}
      {activeStage !== 'analytics' && !hasMatches && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          {activeStage === 'group' 
            ? 'Матчи группового этапа ещё не добавлены. Прогнозы появятся после добавления расписания.'
            : '🏆 Сетка плей-офф будет сформирована после завершения группового этапа.'}
        </Alert>
      )}

      {/* Сообщение, если нет завершённых матчей */}
      {activeStage !== 'analytics' && hasMatches && finishedMatchesCount === 0 && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          На этом этапе пока нет завершённых матчей. Статистика появится после окончания матчей.
        </Alert>
      )}

      {/* Сообщение, если нет прогнозов */}
      {activeStage !== 'analytics' && hasMatches && finishedMatchesCount > 0 && currentStats.filter(s => s.predictionsCount > 0).length === 0 && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Нет прогнозов на этом этапе. Сделайте прогнозы, чтобы увидеть статистику.
        </Alert>
      )}

      {/* Таблица */}
      {/* Таблица для группового этапа и плей-офф */}
      {activeStage !== 'analytics' && hasMatches && finishedMatchesCount > 0 && currentStats.filter(s => s.predictionsCount > 0).length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {icon}
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Chip label={`${currentStats.filter(s => s.predictionsCount > 0).length} участников`} size="small" />
            <Chip label={`${finishedMatchesCount} матчей`} size="small" variant="outlined" />
          </Box>
          <MaterialReactTable table={table} />
        </>
      )}

      {/* Аналитика */}
      {activeStage === 'analytics' && <AnalyticsTab />}      

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