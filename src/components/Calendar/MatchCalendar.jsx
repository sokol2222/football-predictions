import { useState, useEffect, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  alpha,
  Paper,
  Stack,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  SportsSoccer as SoccerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createPrediction, getPredictions, updatePrediction, deletePrediction } from '../../services/api';

// Данные матчей
const matchesData = [
  { id: 1, home: 'Акрон', away: 'ЦСКА', date: '04.04', time: '13:00', stadium: 'Акрон Арена', tour: 21 },
  { id: 2, home: 'Зенит', away: 'Крылья Советов', date: '04.04', time: '15:15', stadium: 'Газпром Арена', tour: 21 },
  { id: 3, home: 'Динамо', away: 'Оренбург', date: '04.04', time: '17:30', stadium: 'ВТБ Арена', tour: 21 },
  { id: 4, home: 'Ахмат', away: 'Краснодар', date: '04.04', time: '19:45', stadium: 'Ахмат Арена', tour: 21 },
  { id: 5, home: 'Нижний Новгород', away: 'Ростов', date: '05.04', time: '14:00', stadium: 'Нижний Новгород', tour: 21 },
  { id: 6, home: 'Динамо (Махачкала)', away: 'Балтика', date: '05.04', time: '16:30', stadium: 'Анжи Арена', tour: 21 },
  { id: 7, home: 'СПАРТАК', away: 'Локомотив', date: '05.04', time: '19:30', stadium: 'Открытие Арена', tour: 21 },
  { id: 8, home: 'Сочи', away: 'Рубин', date: '06.04', time: '19:30', stadium: 'Фишт', tour: 21 },
];

const TOURS = [21];

const MatchCalendar = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [filterTour, setFilterTour] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [pendingPredictions, setPendingPredictions] = useState({});

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const { data } = await getPredictions();
      setPredictions(data || []);
    } catch (error) {
      showSnackbar('Ошибка загрузки прогнозов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const tableData = useMemo(() => {
    const filteredMatches = matchesData.filter(match => {
      const tourMatch = filterTour === 'all' || match.tour === Number(filterTour);
      return tourMatch;
    });

    return filteredMatches.map(match => {
      const userPrediction = predictions.find(p => 
        p.match_id === match.id && 
        (p.user_id === user?.id || p.friend_name === user?.email?.split('@')[0])
      );
      
      const pending = pendingPredictions[match.id];
      
      return {
        ...match,
        id: match.id,
        predictionId: userPrediction?.id || null,
        homeScore: pending?.homeScore !== undefined ? pending.homeScore : (userPrediction?.home_score ?? ''),
        awayScore: pending?.awayScore !== undefined ? pending.awayScore : (userPrediction?.away_score ?? ''),
        hasPrediction: !!userPrediction || !!pending,
        matchName: `${match.home} - ${match.away}`,
      };
    });
  }, [predictions, user, filterTour, pendingPredictions]);

  const startEditing = (row, columnId, currentValue) => {
    setEditingCell({ rowId: row.id, columnId });
    setEditValue(currentValue !== '' && currentValue !== null ? String(currentValue) : '');
  };

  const saveEdit = (row, columnId) => {
    const newValue = editValue === '' ? null : Number(editValue);
    
    if (newValue !== null && (newValue < 0 || newValue > 20)) {
      showSnackbar('Счёт должен быть от 0 до 20', 'error');
      return;
    }

    setPendingPredictions(prev => {
      const current = prev[row.id] || {};
      return {
        ...prev,
        [row.id]: {
          ...current,
          [columnId === 'homeScore' ? 'homeScore' : 'awayScore']: newValue
        }
      };
    });
    
    setEditingCell(null);
    setEditValue('');
    showSnackbar('Прогноз сохранён временно', 'info');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveAllPredictions = async () => {
    let successCount = 0;
    let errorCount = 0;
    
    for (const [matchId, prediction] of Object.entries(pendingPredictions)) {
      if (prediction.homeScore !== undefined && prediction.awayScore !== undefined) {
        try {
          const match = matchesData.find(m => m.id === Number(matchId));
          const existingPrediction = predictions.find(p => 
            p.match_id === Number(matchId) && 
            (p.user_id === user?.id || p.friend_name === user?.email?.split('@')[0])
          );
          
          if (existingPrediction) {
            await updatePrediction(existingPrediction.id, {
              homeScore: Number(prediction.homeScore),
              awayScore: Number(prediction.awayScore)
            });
          } else {
            await createPrediction({
              matchId: Number(matchId),
              homeScore: Number(prediction.homeScore),
              awayScore: Number(prediction.awayScore),
              matchName: `${match.home} - ${match.away}`,
            });
          }
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
    }
    
    if (successCount > 0) {
      showSnackbar(`✅ Сохранено ${successCount} прогнозов`, errorCount > 0 ? 'warning' : 'success');
    }
    
    setPendingPredictions({});
    await loadPredictions();
  };

  const handleDeletePrediction = async (row) => {
    if (window.confirm('Удалить прогноз?')) {
      try {
        await deletePrediction(row.original.predictionId);
        setPendingPredictions(prev => {
          const newState = { ...prev };
          delete newState[row.original.id];
          return newState;
        });
        await loadPredictions();
        showSnackbar('Прогноз удален');
      } catch (error) {
        showSnackbar('Ошибка при удалении', 'error');
      }
    }
  };

  // Красивая ячейка счёта
  const ScoreCell = ({ value, row, columnId }) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === columnId;
    const hasValue = value !== '' && value !== null;
    
    if (isEditing) {
      return (
        <Paper
          elevation={3}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            p: 0.5,
            borderRadius: 2,
            bgcolor: 'background.paper',
            animation: 'pulse 0.2s ease',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.95)', opacity: 0.7 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <TextField
            autoFocus
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveEdit(row, columnId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(row, columnId);
              if (e.key === 'Escape') cancelEdit();
            }}
            inputProps={{
              min: 0,
              max: 20,
              style: { 
                textAlign: 'center', 
                width: '50px', 
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '6px 4px'
              }
            }}
            variant="standard"
            size="small"
            sx={{
              '& .MuiInput-root': {
                '&:before': { borderBottomColor: 'primary.main' },
                '&:after': { borderBottomColor: 'primary.main' },
              },
              '& input': { textAlign: 'center' }
            }}
          />
          <IconButton 
            size="small" 
            color="success" 
            onClick={() => saveEdit(row, columnId)}
            sx={{ p: 0.5 }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={cancelEdit}
            sx={{ p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      );
    }
    
    return (
      <Box
        onClick={() => user && startEditing(row, columnId, value)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          minWidth: '70px',
          py: 1,
          px: 1.5,
          borderRadius: 2,
          cursor: user ? 'pointer' : 'default',
          bgcolor: hasValue 
            ? (theme) => alpha(theme.palette.success.main, 0.1)
            : (theme) => alpha(theme.palette.grey[500], 0.05),
          transition: 'all 0.2s ease',
          border: '1px solid',
          borderColor: hasValue 
            ? (theme) => alpha(theme.palette.success.main, 0.3)
            : (theme) => alpha(theme.palette.divider, 0.5),
          '&:hover': {
            transform: user ? 'translateY(-2px)' : 'none',
            bgcolor: user 
              ? (theme) => alpha(theme.palette.primary.main, 0.1)
              : (theme) => alpha(theme.palette.grey[500], 0.05),
            borderColor: user 
              ? (theme) => theme.palette.primary.main
              : (theme) => alpha(theme.palette.divider, 0.5),
            boxShadow: user ? 2 : 0,
          },
        }}
      >
        {hasValue ? (
          <>
            <Typography 
              sx={{ 
                fontWeight: 800, 
                fontSize: '20px',
                lineHeight: 1,
                color: 'success.main',
              }}
            >
              {value}
            </Typography>
            <SoccerIcon sx={{ fontSize: 16, color: 'success.main', opacity: 0.7 }} />
          </>
        ) : (
          <>
            <Typography 
              sx={{ 
                fontWeight: 500, 
                fontSize: '16px',
                color: 'text.disabled',
              }}
            >
              —
            </Typography>
            <EditIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </>
        )}
      </Box>
    );
  };

  // Определяем колонки
  const columns = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: 'Дата',
        size: 100,
        enableEditing: false,
        Cell: ({ row }) => (
          <Stack spacing={0.5}>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
              {row.original.date}
            </Typography>
            <Chip 
              label={row.original.time} 
              size="small" 
              variant="outlined"
              sx={{ width: 'fit-content' }}
            />
          </Stack>
        ),
      },
      {
        accessorKey: 'matchName',
        header: 'Матч',
        size: 300,
        enableEditing: false,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
              {row.original.home}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>vs</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
              {row.original.away}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'stadium',
        header: 'Стадион',
        size: 150,
        enableEditing: false,
        Cell: ({ cell }) => (
          <Typography variant="body2" color="text.secondary">
            {cell.getValue()}
          </Typography>
        ),
      },
      {
        accessorKey: 'homeScore',
        header: '🏠 Хозяева',
        size: 130,
        enableEditing: false,
        Cell: ({ cell, row }) => (
          <ScoreCell 
            value={cell.getValue()} 
            row={row.original} 
            columnId="homeScore"
          />
        ),
      },
      {
        accessorKey: 'awayScore',
        header: '✈️ Гости',
        size: 130,
        enableEditing: false,
        Cell: ({ cell, row }) => (
          <ScoreCell 
            value={cell.getValue()} 
            row={row.original} 
            columnId="awayScore"
          />
        ),
      },
    ],
    [user, editingCell, editValue],
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableEditing: false,
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => {
      const hasPrediction = row.original.hasPrediction;
      if (!user || !hasPrediction) return null;
      
      return (
        <Tooltip title="Удалить прогноз">
          <IconButton 
            color="error" 
            size="small"
            onClick={() => handleDeletePrediction(row)}
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      );
    },
    muiTableBodyRowProps: {
      sx: {
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 700,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
      },
    },
    initialState: {
      density: 'comfortable',
      pagination: { pageSize: 10 },
    },
    localization: {
      actions: 'Действия',
      delete: 'Удалить',
      search: 'Поиск',
      showAll: 'Показать все',
      rowsPerPage: 'Строк на странице',
    },
    state: {
      isLoading: loading,
    },
  });

  const hasPending = Object.keys(pendingPredictions).length > 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        📅 Календарь матчей
      </Typography>

      {/* Фильтры */}
      <Box sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', bgcolor: 'background.paper', borderRadius: 2 }}>
        <FilterIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Тур</InputLabel>
          <Select
            value={filterTour}
            label="Тур"
            onChange={(e) => setFilterTour(e.target.value)}
          >
            <MenuItem value="all">Все туры</MenuItem>
            {TOURS.map(tour => (
              <MenuItem key={tour} value={tour}>{tour} тур</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Chip 
          label={`${tableData.length} матчей`} 
          size="small" 
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Таблица */}
      <MaterialReactTable table={table} />

      {/* Кнопка сохранения */}
      {hasPending && (
        <Box sx={{ 
          position: 'sticky', 
          bottom: 16, 
          display: 'flex', 
          justifyContent: 'flex-end',
          mt: 2,
          zIndex: 1000
        }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={saveAllPredictions}
            startIcon={<SaveIcon />}
            sx={{
              boxShadow: 3,
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '16px',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            Сохранить все прогнозы ({Object.keys(pendingPredictions).length})
          </Button>
        </Box>
      )}

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MatchCalendar;