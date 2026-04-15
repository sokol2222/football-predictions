import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  Alert,
  Snackbar,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAllTournaments, 
  getTournamentParticipants, 
  addTournamentParticipant,
  getActiveTournament 
} from '../../services/api';

const ParticipantsList = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadParticipants();
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const { data: tournamentsData } = await getAllTournaments();
      setTournaments(tournamentsData || []);
      
      // Выбираем активный турнир по умолчанию
      const activeTournament = tournamentsData?.find(t => t.is_active);
      if (activeTournament) {
        setSelectedTournament(activeTournament);
      } else if (tournamentsData?.length > 0) {
        setSelectedTournament(tournamentsData[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки турниров:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!selectedTournament) return;
    
    try {
      const { data: participantsData } = await getTournamentParticipants(selectedTournament.id);
      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    }
  };

  const handleJoinTournament = async () => {
    if (!user) {
      showSnackbar('Сначала авторизуйтесь', 'error');
      return;
    }
    
    const alreadyJoined = participants.some(p => p.user_id === user.id);
    if (alreadyJoined) {
      showSnackbar('Вы уже участвуете в этом турнире', 'info');
      return;
    }
    
    setJoining(true);
    try {
      const displayName = user.email?.split('@')[0] || 'Пользователь';
      await addTournamentParticipant(selectedTournament.id, user.id, displayName);
      showSnackbar(`Вы присоединились к турниру "${selectedTournament.name} ${selectedTournament.year}"!`, 'success');
      await loadParticipants();
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setJoining(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const isCurrentUserParticipant = user && participants.some(p => p.user_id === user.id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
        👥 Участники
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Присоединяйтесь к турнирам и соревнуйтесь с друзьями
      </Typography>

      {/* Выбор турнира */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Выберите турнир</InputLabel>
              <Select
                value={selectedTournament?.id || ''}
                onChange={(e) => {
                  const tournament = tournaments.find(t => t.id === e.target.value);
                  setSelectedTournament(tournament);
                }}
                label="Выберите турнир"
              >
                {tournaments.map((tournament) => (
                  <MenuItem key={tournament.id} value={tournament.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrophyIcon fontSize="small" color={tournament.is_active ? 'primary' : 'disabled'} />
                      <span>{tournament.name} {tournament.year}</span>
                      {tournament.is_active && (
                        <Chip label="Активный" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedTournament && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedTournament.start_date).toLocaleDateString()} — {new Date(selectedTournament.end_date).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Информация о турнире */}
      {selectedTournament && (
        <Card sx={{ mb: 3, bgcolor: theme.palette.mode === 'dark' 
    ? 'rgba(144, 202, 249, 0.05)'  // светло-синий для тёмной темы
    : 'rgba(25, 118, 210, 0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TrophyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {selectedTournament.name} {selectedTournament.year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTournament.description}
                </Typography>
              </Box>
              {!isCurrentUserParticipant && user && (
                <Button
                  variant="contained"
                  onClick={handleJoinTournament}
                  disabled={joining}
                  startIcon={joining ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                  {joining ? 'Присоединение...' : 'Присоединиться к турниру'}
                </Button>
              )}
              {isCurrentUserParticipant && (
                <Chip
                  icon={<CheckIcon />}
                  label="Вы участвуете"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Сообщение для неавторизованных */}
      {!user && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Войдите или зарегистрируйтесь, чтобы присоединиться к турниру
        </Alert>
      )}

      {/* Список участников */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' 
    ? 'rgba(144, 202, 249, 0.05)'  // светло-синий для тёмной темы
    : 'rgba(25, 118, 210, 0.05)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Участники турнира ({participants.length})
          </Typography>
        </Box>
        
        {participants.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">Пока нет участников</Typography>
            {user && !isCurrentUserParticipant && (
              <Button
                variant="contained"
                size="small"
                onClick={handleJoinTournament}
                sx={{ mt: 2 }}
              >
                Стать первым участником
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {participants.map((participant, index) => (
              <Box key={participant.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {participant.display_name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {participant.display_name}
                        {user?.id === participant.user_id && (
                          <Chip label="Вы" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={`Присоединился: ${new Date(participant.joined_at).toLocaleDateString()}`}
                  />
                </ListItem>
                {index < participants.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ParticipantsList;