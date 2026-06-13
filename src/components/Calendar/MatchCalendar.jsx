import { useState, useEffect, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Flag as FlagIcon,
  FilterList as FilterIcon,
  Scoreboard as ScoreIcon,
  EmojiEvents as EmojiEventsIcon,
  CalendarMonth
} from '@mui/icons-material';
import { getActiveTournament, getMatches, getRoundsByTournament } from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';

const MatchCalendar = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('all');

  useEffect(() => {
    loadTournamentAndMatches();
  }, []);

  const loadTournamentAndMatches = async () => {
    try {
      setLoading(true);
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: matchesData } = await getMatches(tournamentData.id);
        setAllMatches(matchesData || []);
        
        const { data: roundsData } = await getRoundsByTournament(tournamentData.id);
        setRounds(roundsData || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    if (selectedRound === 'all') return allMatches;
    return allMatches.filter(match => match.round_number === selectedRound);
  }, [allMatches, selectedRound]);

  const stats = useMemo(() => {
    const total = allMatches.length;
    const byRound = {};
    const finished = allMatches.filter(m => m.is_finished && m.actual_home_score !== null).length;
    allMatches.forEach(m => {
      byRound[m.round_number] = (byRound[m.round_number] || 0) + 1;
    });
    return { total, byRound, finished };
  }, [allMatches]);

  // Функция для определения цвета счёта
  const getScoreColor = (match) => {
    if (!match.is_finished) return 'text.secondary';
    if (match.actual_home_score > match.actual_away_score) return 'success.main';
    if (match.actual_away_score > match.actual_home_score) return 'error.main';
    return 'warning.main';
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'round_number',
        header: 'Тур',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            label={getStageLabel(cell.getValue())}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          />
        ),
      },
      {
        accessorKey: 'match_number',
        header: '№',
        size: 60,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {cell.getValue()}
          </Typography>
        ),
      },
      {
        accessorKey: 'match_date',
        header: 'Дата',
        size: 110,
        Cell: ({ cell, row }) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {new Date(cell.getValue()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.match_time?.slice(0, 5)}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'group',
        header: 'Гр.',
        size: 50,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue()}
            size="small"
            sx={{
              width: 32,
              height: 32,
              fontWeight: 700,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          />
        ),
      },
      {
        accessorKey: 'home_team',
        header: 'Матч',
        size: 280,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {row.original.home_team} — {row.original.away_team}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.home_team_code} — {row.original.away_team_code}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Счёт',
        size: 100,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const scoreA = rowA.original.actual_home_score || 0;
          const scoreB = rowB.original.actual_home_score || 0;
          return scoreA - scoreB;
        },
        Cell: ({ row }) => {
          const match = row.original;
          const isFinished = match.is_finished;
          const homeScore = match.actual_home_score;
          const awayScore = match.actual_away_score;
          const scoreColor = getScoreColor(match);
          
          if (!isFinished || homeScore === null) {
            return (
              <Chip
                label="— : —"
                size="small"
                variant="outlined"
                sx={{ minWidth: 70 }}
              />
            );
          }
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: scoreColor,
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                }}
              >
                {homeScore} : {awayScore}
              </Typography>              
            </Box>
          );
        },
      },
      {
        accessorKey: 'stadium',
        header: 'Стадион',
        size: 180,
        Cell: ({ cell, row }) => (
          <Box>
            <Typography variant="body2" noWrap>
              {cell.getValue()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.city}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'country',
        header: 'Страна',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue()}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        ),
      },
    ],
    [theme]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredMatches,
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableColumnOrdering: true,
    initialState: {
      pagination: { pageSize: 25 },
      sorting: [{ id: 'match_number', desc: false }],
      columnVisibility: { country: false },
    },
    state: { isLoading: loading },
    localization: {
      search: 'Поиск матча, команды или стадиона',
      clearSearch: 'Очистить',
      rowsPerPage: 'Матчей на странице',
      showAll: 'Показать все',
      all: 'Все',
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: { borderRadius: 2, border: '1px solid', borderColor: 'divider' },
    },
  });

  const finishedCount = stats.finished;
  const totalCount = stats.total;
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          <CalendarMonth/> Календарь матчей
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year}
        </Typography>
      </Box>

      {/* Фильтр по турам */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <FilterIcon color="action" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Показать:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            displayEmpty
          >
            <MenuItem value="all">📋 Все матчи ({totalCount})</MenuItem>
            {rounds.map(round => (
              <MenuItem key={round.round_number} value={round.round_number}>
                {getStageLabel(round.round_number)} ({stats.byRound[round.round_number] || 0} матчей)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Индикатор сыгранных матчей */}
        {finishedCount > 0 && (
          <Chip
            icon={<ScoreIcon />}
            label={`Сыграно: ${finishedCount} / ${totalCount}`}
            size="small"
            color="info"
            variant="outlined"
          />
        )}
      </Paper>


      {selectedRound !== 'all' && selectedRound >= 4 && filteredMatches.length === 0 && (
        <Alert
          severity="info" 
          icon={<EmojiEventsIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            🏆 {getStageLabel(selectedRound)}
          </Typography>
          <Typography variant="body2">
            Сетка плей-офф будет сформирована после завершения группового этапа.
            Следите за обновлениями!
          </Typography>
        </Alert>
      )}

      {/* Таблица */}
      <MaterialReactTable table={table} />

      {/* Легенда */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip icon={<LocationIcon />} label="16 стадионов" size="small" variant="outlined" />
        <Chip icon={<FlagIcon />} label="3 страны: США, Канада, Мексика" size="small" variant="outlined" />
        <Chip label="Московское время (MSK)" size="small" variant="outlined" />
        <Chip label="🟢 Победа хозяев" size="small" sx={{ bgcolor: alpha('#4caf50', 0.1) }} />
        <Chip label="🔴 Победа гостей" size="small" sx={{ bgcolor: alpha('#f44336', 0.1) }} />
        <Chip label="🟡 Ничья" size="small" sx={{ bgcolor: alpha('#ff9800', 0.1) }} />
      </Box>
    </Box>
  );
};

export default MatchCalendar;