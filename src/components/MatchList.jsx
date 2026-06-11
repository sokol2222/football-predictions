import { useState, useEffect } from 'react';
import {
  Grid, CircularProgress, Typography, Box, Card, CardContent, 
  Chip, Button, Paper, alpha, useTheme, Avatar, AvatarGroup,
  LinearProgress, Divider
} from '@mui/material';
import { 
  getMatches, getActiveTournament, getTournamentParticipants, 
  getPredictions, getUserPredictionsForTournament 
} from '../services/api';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoIcon from '@mui/icons-material/Info';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from './Auth/AuthButton';
import { getStageLabel } from '../utils/stageUtils';
import TournamentInfo from './Info/TournamentInfo';

const MatchList = ({ onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [tournament, setTournament] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [nextDeadline, setNextDeadline] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        // Загружаем матчи
        const { data: matchesData } = await getMatches(tournamentData.id);
        
        // Сортируем и берём ближайшие 4 матча
        const sortedMatches = [...(matchesData || [])].sort((a, b) => {
          const dateA = new Date(`${a.match_date}T${a.match_time}Z`);
          const dateB = new Date(`${b.match_date}T${b.match_time}Z`);
          return dateA - dateB;
        });
        
        const now = new Date();
        const futureMatches = sortedMatches.filter(m => {
          const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
          return matchDate > now;
        });
        
        setUpcomingMatches(futureMatches.slice(0, 4));
        
        // Находим ближайший дедлайн
        const upcomingDeadline = sortedMatches.find(m => {
          const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
          return matchDate > now;
        });
        if (upcomingDeadline) {
          setNextDeadline({
            match: `${upcomingDeadline.home_team} — ${upcomingDeadline.away_team}`,
            date: new Date(`${upcomingDeadline.match_date}T${upcomingDeadline.match_time}Z`)
          });
        }
        
        // Загружаем участников и их очки
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        // Рассчитываем очки участников
        const participantsWithPoints = await Promise.all(
          participantsData.map(async (p) => {
            const { data: predictions } = await getUserPredictionsForTournament(
              p.user_id, tournamentData.id
            );
            const totalPoints = predictions?.reduce((sum, pred) => sum + (pred.points_earned || 0), 0) || 0;
            return { ...p, totalPoints };
          })
        );
        
        // Топ-3
        const sorted = participantsWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);
        setLeaders(sorted.slice(0, 3));
        
        // Находим текущего пользователя в рейтинге
        if (user) {
          const userStats = sorted.find(p => p.user_id === user.id);
          if (userStats) {
            const position = sorted.findIndex(p => p.user_id === user.id) + 1;
            setUserRank({ position, totalPoints: userStats.totalPoints });
          }
        }
        
        // Общее количество прогнозов
        const { data: allPredictions } = await getPredictions();
        setTotalPredictions(allPredictions?.length || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMatchDate = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} • ${timeStr?.slice(0, 5)}`;
  };

  const getTimeLeft = (matchDate) => {
    const now = new Date();
    now.setHours(now.getHours() + 3);
    const diff = matchDate - now;
    if (diff <= 0) return 'Сейчас идёт';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} дн. ${hours % 24} ч.`;
    if (hours > 0) return `${hours} ч. ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))} мин.`;
    return `${Math.floor(diff / (1000 * 60))} мин.`;
  };

  const handleNavigate = (page) => {
    if (onNavigate) onNavigate(page);
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
      {/* Приветствие */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {user ? `Привет, ${user.email?.split('@')[0]}! 👋` : 'Добро пожаловать! 🏆'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Делай прогнозы на матчи {tournament?.name} {tournament?.year}
        </Typography>
         <Button
          variant="outlined"
          startIcon={<InfoIcon />}
          onClick={() => setInfoOpen(true)}
        >
          О турнире
        </Button>
      </Box>

      {/* Статистика в цифрах */}
      {/*<Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <PeopleIcon sx={{ fontSize: 28, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{participants.length}</Typography>
            <Typography variant="caption" color="text.secondary">участников</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <ScoreboardIcon sx={{ fontSize: 28, color: 'success.main', mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalPredictions}</Typography>
            <Typography variant="caption" color="text.secondary">прогнозов</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <EmojiEventsIcon sx={{ fontSize: 28, color: 'warning.main', mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{leaders[0]?.totalPoints || 0}</Typography>
            <Typography variant="caption" color="text.secondary">очков у лидера</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CalendarMonthIcon sx={{ fontSize: 28, color: 'info.main', mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{upcomingMatches.length}</Typography>
            <Typography variant="caption" color="text.secondary">матчей скоро</Typography>
          </Paper>
        </Grid>
      </Grid>
      */}

      {/* Топ участников */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        🏆 Топ участников
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {leaders.map((leader, idx) => (
          <Grid item xs={12} sm={4} key={leader.user_id}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 2, 
              bgcolor: alpha(
                idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32', 
                0.1
              ),
              borderRadius: 3
            }}>
              <Avatar sx={{ 
                width: 56, height: 56, mx: 'auto', mb: 1,
                bgcolor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                fontSize: 28, fontWeight: 700, color: '#333'
              }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{leader.display_name}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {leader.totalPoints}
              </Typography>
              <Typography variant="caption" color="text.secondary">очков</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Прогресс пользователя */}
      {user && userRank && (
        <Paper sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">Ваше место</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {userRank.position} / {participants.length}
              </Typography>
            </Box>
            <Box sx={{ flex: 2 }}>
              <Typography variant="body2" color="text.secondary">До лидера</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={leaders[0]?.totalPoints ? (userRank.totalPoints / leaders[0].totalPoints) * 100 : 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {leaders[0]?.totalPoints - userRank.totalPoints} очков
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleNavigate('stage-stats')}
            >
              Подробнее
            </Button>
          </Box>
        </Paper>
      )}

      {/* Ближайшие матчи */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        🗓️ Ближайшие матчи
      </Typography>
      
      {upcomingMatches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Нет предстоящих матчей</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {upcomingMatches.map((match) => {
            const matchDate = new Date(`${match.match_date}T${match.match_time}Z`);
            const timeLeft = getTimeLeft(matchDate);
            const isSoon = matchDate - new Date() < 24 * 60 * 60 * 1000;
            
            return (
              <Grid item xs={12} sm={6} md={3} key={match.id}>
                <Card sx={{ borderRadius: 2, height: '100%', position: 'relative', overflow: 'visible' }}>
                  {isSoon && (
                    <Chip
                      label={timeLeft}
                      size="small"
                      color="warning"
                      sx={{ position: 'absolute', top: -12, left: 16 }}
                    />
                  )}
                  <CardContent>
                    <Chip
                      label={getStageLabel(match.round_number)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 1, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatMatchDate(match.match_date, match.match_time)}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {match.home_team} <span style={{ color: theme.palette.text.secondary }}>—</span> {match.away_team}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 2 }}>
                      🏟️ {match.stadium}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => handleNavigate('my-predictions')}
                    >
                      Сделать прогноз
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Быстрый доступ */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => handleNavigate('calendar')}
        >
          Все матчи
        </Button>
        <Button
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={() => handleNavigate('participants')}
        >
          Участники
        </Button>
        <Button
          variant="outlined"
          startIcon={<EmojiEventsIcon />}
          onClick={() => handleNavigate('stats')}
        >
          Статистика
        </Button>       
      </Box>

      <TournamentInfo open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Box>
  );
};

export default MatchList;