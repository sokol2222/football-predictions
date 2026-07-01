import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Grid, CircularProgress, Typography, Box, Card, CardContent, 
  Chip, Button, Paper, alpha, useTheme, Avatar,
  LinearProgress, Tabs, Tab, Skeleton
} from '@mui/material';
import { 
  getMatches, getActiveTournament, getTournamentParticipants, 
  getPredictions, getUserPredictionsForTournament 
} from '../services/api';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import InfoIcon from '@mui/icons-material/Info';
import StadiumIcon from '@mui/icons-material/Stadium';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from './Auth/AuthButton';
import { getStageLabel } from '../utils/stageUtils';
import TournamentInfo from './Info/TournamentInfo';
import { supabase } from '../lib/supabase';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

const getStageType = (roundNumber) => {
  if (roundNumber < 4) return 'group';
  if (roundNumber >= 4 && roundNumber <= 8) return 'playoff';
  return 'group';
};

const calculatePoints = (prediction, actualResult) => {
  if (!actualResult || actualResult.home === undefined || actualResult.away === undefined) {
    return { points: 0 };
  }
  
  const homeScore = prediction?.home_score ?? prediction?.homeScore ?? 0;
  const awayScore = prediction?.away_score ?? prediction?.awayScore ?? 0;
  const actualHome = actualResult.home;
  const actualAway = actualResult.away;
  
  if (homeScore === actualHome && awayScore === actualAway) {
    return { points: 3 };
  }
  
  if ((homeScore - awayScore) === (actualHome - actualAway)) {
    return { points: 2 };
  }
  
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  if (getOutcome(homeScore, awayScore) === getOutcome(actualHome, actualAway)) {
    return { points: 1 };
  }
  
  return { points: 0 };
};

// ============================================================
// КОМПОНЕНТ КАРТОЧКИ ТОПА
// ============================================================

const LeaderCard = ({ leader, idx }) => {
  const medals = [
    <EmojiEventsIcon sx={{ fontSize: 32, color: '#333' }} />,
    <LooksTwoIcon sx={{ fontSize: 32, color: '#333' }} />,
    <Looks3Icon sx={{ fontSize: 32, color: '#333' }} />
  ];
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  
  return (
    <Grid item xs={12} sm={4}>
      <Card sx={{ 
        textAlign: 'center', 
        p: 2, 
        bgcolor: alpha(colors[idx] || '#888', 0.1),
        borderRadius: 3,
      }}>
        <Avatar sx={{ 
          width: 56, height: 56, mx: 'auto', mb: 1,
          bgcolor: colors[idx] || '#888',
          fontSize: 28, fontWeight: 700, color: '#333'
        }}>
          {medals[idx] || idx + 1}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{leader.display_name}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {leader.totalPoints || 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">очков</Typography>
        <Chip 
          label={`${leader.matchesCount || 0} матчей`}
          size="small"
          variant="outlined"
          sx={{ mt: 1, fontSize: '0.6rem' }}
        />
      </Card>
    </Grid>
  );
};

// ============================================================
// КОМПОНЕНТ СКЕЛЕТОНА КАРТОЧКИ МАТЧА
// ============================================================

const MatchSkeleton = () => (
  <Grid item xs={12} sm={6} md={3}>
    <Card sx={{ p: 2, height: 200 }}>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="90%" height={28} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="70%" height={20} />
      <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} />
    </Card>
  </Grid>
);

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

const MatchList = ({ onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const isMounted = useRef(true);
  
  const [tournament, setTournament] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 - групповой, 1 - плейофф, 2 - общее
  
  // Топы
  const [leaders, setLeaders] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [leadersMap, setLeadersMap] = useState({ group: [], playoff: [], overall: [] });

  // ============================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================

  useEffect(() => {
    isMounted.current = true;
    loadHomeData();
    
    return () => {
      isMounted.current = false;
    };
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      if (!isMounted.current) return;
      setTournament(tournamentData);
      
      if (tournamentData) {
        const [matchesRes, participantsRes] = await Promise.all([
          getMatches(tournamentData.id),
          getTournamentParticipants(tournamentData.id)
        ]);
        
        if (!isMounted.current) return;
        
        const matchesData = matchesRes.data || [];
        const participantsData = participantsRes.data || [];
        
        setAllMatches(matchesData);
        setParticipants(participantsData);
        
        // Загружаем прогнозы
        const predictionsMap = {};
        for (const participant of participantsData) {
          let userPredictions = [];
          const key = participant.user_id || participant.display_name;
          
          if (participant.user_id) {
            const { data } = await getUserPredictionsForTournament(participant.user_id, tournamentData.id);
            userPredictions = data || [];
          } else if (participant.display_name) {
            const { data, error } = await supabase
              .from('predictions')
              .select('*')
              .eq('friend_name', participant.display_name)
              .eq('tournament_id', tournamentData.id);
            if (!error) userPredictions = data || [];
          }
          
          const map = {};
          userPredictions.forEach(p => { map[p.match_id] = p; });
          predictionsMap[key] = map;
        }
        
        // Группируем матчи
        const groupMatchesList = matchesData.filter(m => getStageType(m.round_number) === 'group');
        const playoffMatchesList = matchesData.filter(m => getStageType(m.round_number) === 'playoff');
        
        // Функция расчёта
        const calc = (matchesList) => {
          return participantsData.map(p => {
            const key = p.user_id || p.display_name;
            let totalPoints = 0;
            let finishedMatches = 0;
            
            for (const match of matchesList) {
              if (match.is_finished && match.actual_home_score !== null) {
                finishedMatches++;
                const pred = predictionsMap[key]?.[match.id];
                if (pred) {
                  totalPoints += calculatePoints(pred, {
                    home: match.actual_home_score,
                    away: match.actual_away_score,
                  }).points;
                }
              }
            }
            return { ...p, totalPoints, matchesCount: finishedMatches };
          }).sort((a, b) => b.totalPoints - a.totalPoints);
        };
        
        const groupLeaders = calc(groupMatchesList);
        const playoffLeaders = calc(playoffMatchesList);
        const overallLeaders = calc(matchesData);
        
        const map = {
          group: groupLeaders,
          playoff: playoffLeaders,
          overall: overallLeaders,
        };
        
        if (!isMounted.current) return;
        setLeadersMap(map);
        
        // Определяем активную вкладку по умолчанию
        let defaultTab = 2; // общее
        if (playoffMatchesList.length > 0) {
          defaultTab = 1; // плей-офф
        } else if (groupMatchesList.length > 0) {
          defaultTab = 0; // групповой
        }
        setActiveTab(defaultTab);
        
        // Устанавливаем топ для выбранной вкладки
        const tabKey = defaultTab === 0 ? 'group' : defaultTab === 1 ? 'playoff' : 'overall';
        const currentLeaders = map[tabKey] || [];
        setLeaders(currentLeaders.slice(0, 3));
        
        // Ранг пользователя
        if (user) {
          const userStats = currentLeaders.find(p => p.user_id === user.id);
          if (userStats) {
            const position = currentLeaders.findIndex(p => p.user_id === user.id) + 1;
            setUserRank({ position, totalPoints: userStats.totalPoints });
          } else {
            setUserRank(null);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // ============================================================
  // СМЕНА ВКЛАДКИ
  // ============================================================
  
  const handleTabChange = useCallback((e, newValue) => {
    const tabKey = newValue === 0 ? 'group' : newValue === 1 ? 'playoff' : 'overall';
    const currentLeaders = leadersMap[tabKey] || [];
    
    setActiveTab(newValue);
    setLeaders(currentLeaders.slice(0, 3));
    
    if (user) {
      const userStats = currentLeaders.find(p => p.user_id === user.id);
      if (userStats) {
        const position = currentLeaders.findIndex(p => p.user_id === user.id) + 1;
        setUserRank({ position, totalPoints: userStats.totalPoints });
      } else {
        setUserRank(null);
      }
    }
  }, [leadersMap, user]);

  // ============================================================
  // ФИЛЬТРАЦИЯ МАТЧЕЙ
  // ============================================================
  
  const groupMatches = allMatches.filter(m => getStageType(m.round_number) === 'group');
  const playoffMatches = allMatches.filter(m => getStageType(m.round_number) === 'playoff');

  const getUpcomingMatches = useCallback((matches) => {
    const now = new Date();
    return matches
      .filter(m => {
        const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
        return matchDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.match_date}T${a.match_time}Z`);
        const dateB = new Date(`${b.match_date}T${b.match_time}Z`);
        return dateA - dateB;
      })
      .slice(0, 4);
  }, []);

  const displayedMatches = activeTab === 0 ? getUpcomingMatches(groupMatches) 
    : activeTab === 1 ? getUpcomingMatches(playoffMatches) 
    : getUpcomingMatches(allMatches);

  const getTabLabel = useCallback((matches) => {
    const now = new Date();
    return matches.filter(m => {
      const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
      return matchDate > now;
    }).length;
  }, []);

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================================

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

  const getTabTitle = () => {
    if (activeTab === 0) return 'групповом этапе';
    if (activeTab === 1) return 'плей-офф';
    return 'турнире';
  };

  // ============================================================
  // РЕНДЕР КАРТОЧКИ МАТЧА
  // ============================================================

  const renderMatchCard = useCallback((match) => {
    const matchDate = new Date(`${match.match_date}T${match.match_time}Z`);
    const timeLeft = getTimeLeft(matchDate);
    const isSoon = matchDate - new Date() < 24 * 60 * 60 * 1000;
    const stageType = getStageType(match.round_number);
    
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Chip
                label={getStageLabel(match.round_number)}
                size="small"
                color={stageType === 'playoff' ? 'secondary' : 'primary'}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {stageType === 'playoff' && (
                <Chip
                  label="🏆 Плей-офф"
                  size="small"
                  color="secondary"
                  sx={{ fontSize: '0.6rem', height: 20 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {formatMatchDate(match.match_date, match.match_time)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {match.home_team} <span style={{ color: theme.palette.text.secondary }}>—</span> {match.away_team}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 2 }}>
              <StadiumIcon fontSize="inherit" /> {match.stadium} ({match.country})
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
  }, [theme]);

  // ============================================================
  // РЕНДЕР
  // ============================================================

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>🏆 Топ участников</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={4} key={i}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Skeleton variant="circular" width={56} height={56} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <MatchSkeleton key={i} />
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Приветствие */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {user ? `Привет, ${user.email?.split('@')[0]}! 👋` : 'Добро пожаловать! 🏆'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Делай прогнозы на матчи {tournament?.name} {tournament?.year}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<InfoIcon />} onClick={() => setInfoOpen(true)} sx={{ borderRadius: 2 }}>
          О турнире
        </Button>
      </Box>

      {/* Вкладки */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<GroupWorkIcon />} iconPosition="start" label={`Групповой (${getTabLabel(groupMatches)})`} />
          <Tab icon={<EmojiEventsOutlinedIcon />} iconPosition="start" label={`Плей-офф (${getTabLabel(playoffMatches)})`} />
          <Tab icon={<DashboardIcon />} iconPosition="start" label={`Общее (${getTabLabel(allMatches)})`} />
        </Tabs>
      </Paper>

      {/* Топ */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>🏆 Топ участников на {getTabTitle()}</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {leaders.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {activeTab === 0 ? 'Нет данных о лидерах группового этапа' 
                  : activeTab === 1 ? 'Нет данных о лидерах плей-офф' 
                  : 'Нет данных о лидерах турнира'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          leaders.map((leader, idx) => <LeaderCard key={leader.id || leader.display_name} leader={leader} idx={idx} />)
        )}
      </Grid>

      {/* Прогресс пользователя */}
      {user && userRank && userRank.position && (
        <Paper sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{user.email?.charAt(0).toUpperCase()}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Ваше место {activeTab === 0 ? '(групповой этап)' : activeTab === 1 ? '(плей-офф)' : '(общее)'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {userRank.position} / {leaders.length || participants.length}
              </Typography>
            </Box>
            <Box sx={{ flex: 2 }}>
              <Typography variant="body2" color="text.secondary">До лидера</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={leaders[0]?.totalPoints ? Math.min((userRank.totalPoints / leaders[0].totalPoints) * 100, 100) : 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 70 }}>
                  {leaders[0]?.totalPoints - userRank.totalPoints} очков
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">У вас: <strong>{userRank.totalPoints}</strong> очков</Typography>
                <Typography variant="caption" color="text.secondary">У лидера: <strong>{leaders[0]?.totalPoints}</strong> очков</Typography>
              </Box>
            </Box>
            <Button variant="outlined" size="small" onClick={() => handleNavigate('stage-stats')}>Подробнее</Button>
          </Box>
        </Paper>
      )}

      {/* Ближайшие матчи */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        <CalendarMonthIcon /> Ближайшие матчи {activeTab === 0 && ' (групповой этап)'}{activeTab === 1 && ' (плей-офф)'}
      </Typography>
      {displayedMatches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {activeTab === 0 ? 'Нет предстоящих матчей группового этапа' 
              : activeTab === 1 ? 'Нет предстоящих матчей плей-офф' 
              : 'Нет предстоящих матчей'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>{displayedMatches.map(renderMatchCard)}</Grid>
      )}

      {/* Быстрый доступ */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<CalendarMonthIcon />} onClick={() => handleNavigate('calendar')}>Все матчи</Button>
        <Button variant="outlined" startIcon={<PeopleIcon />} onClick={() => handleNavigate('participants')}>Участники</Button>
        <Button variant="outlined" startIcon={<EmojiEventsIcon />} onClick={() => handleNavigate('stage-stats')}>Статистика</Button>
      </Box>

      <TournamentInfo open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Box>
  );
};

export default MatchList;