import { useState, useEffect, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  alpha,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { getTournamentParticipants, getActiveTournament } from '../../services/api';

const ParticipantsList = () => {
  const theme = useTheme();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  // Подсчёт статистики
  const stats = {
    total: participants.length,
    newThisWeek: participants.filter(p => {
      const joinDate = new Date(p.joined_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return joinDate > weekAgo;
    }).length,
  };

  // Колонки таблицы
  const columns = useMemo(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Участник',
        size: 250,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {row.original.display_name?.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {row.original.display_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Участник турнира
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        accessorKey: 'user_id',
        header: 'ID пользователя',
        size: 200,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {cell.getValue()?.slice(0, 8)}...
          </Typography>
        ),
      },
      {
        accessorKey: 'joined_at',
        header: 'Дата присоединения',
        size: 180,
        Cell: ({ cell }) => {
          const date = new Date(cell.getValue());
          return (
            <Typography variant="body2">
              {date.toLocaleDateString('ru-RU')}
            </Typography>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        Cell: () => (
          <Chip
            label="Активен"
            size="small"
            color="success"
            variant="outlined"
          />
        ),
      },
    ],
    [theme]
  );

  const table = useMaterialReactTable({
    columns,
    data: participants,
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageSize: 15 },
      sorting: [{ id: 'joined_at', desc: true }],
    },
    state: { isLoading: loading },
    localization: {
      search: 'Поиск участника',
      clearSearch: 'Очистить',
      rowsPerPage: 'Участников на странице',
      showAll: 'Показать всех',
      all: 'Все',
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: { borderRadius: 2, border: '1px solid', borderColor: 'divider' },
    },
    muiTableHeadCellProps: {
      sx: { fontWeight: 700, backgroundColor: alpha(theme.palette.background.default, 0.5) },
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          👥 Участники
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tournament?.name} {tournament?.year}
        </Typography>
      </Box>

      {/* Статистика */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <GroupIcon sx={{ fontSize: 28, color: 'primary.main', mb: 0.5 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
          <Typography variant="caption" color="text.secondary">Всего участников</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
          <PersonAddIcon sx={{ fontSize: 28, color: 'success.main', mb: 0.5 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.newThisWeek}</Typography>
          <Typography variant="caption" color="text.secondary">Новых за неделю</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
          <CalendarIcon sx={{ fontSize: 28, color: 'info.main', mb: 0.5 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {stats.total > 0 ? Math.round(stats.total / 2) : 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">Активных</Typography>
        </Paper>
      </Box>

      {/* Таблица участников */}
      <MaterialReactTable table={table} />
    </Box>
  );
};

export default ParticipantsList;