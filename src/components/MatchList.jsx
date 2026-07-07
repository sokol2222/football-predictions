import { useState, useEffect } from 'react';
import {
  Grid, CircularProgress, Typography, Box, Card, CardContent, 
  Chip, Button, Paper, alpha, useTheme, Avatar,
  LinearProgress, Tabs, Tab
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

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

const MatchList = ({ onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [tournament, setTournament] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // 0 - групповой, 1 - плейофф, 2 - общее

  // ============================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: matchesData } = await getMatches(tournamentData.id);
        setAllMatches(matchesData || []);
        
        const { data: participantsData } = await getTournamentParticipants(tournamentData.id);
        setParticipants(participantsData || []);
        
        // Общее количество прогнозов
        const { data: allPredictions } = await getPredictions();
        setTotalPredictions(allPredictions?.length || 0);
        
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
        
        // Рассчитываем очки по этапам
        const groupMatchesList = matchesData?.filter(m => getStageType(m.round_number) === 'group') || [];
        const playoffMatchesList = matchesData?.filter(m => getStageType(m.round_number) === 'playoff') || [];
        const allMatchesList = matchesData || [];
        
        // Функция расчёта очков для списка матчей
        const calculatePointsForMatches = (matchesList) => {
          return participantsData.map(participant => {
            const predictionKey = participant.user_id || participant.display_name;
            let totalPoints = 0;
            let finishedMatches = 0;
            
            for (const match of matchesList) {
              if (match.is_finished && match.actual_home_score !== null) {
                finishedMatches++;
                const prediction = predictionsMap[predictionKey]?.[match.id];
                if (prediction) {
                  const actualResult = {
                    home: match.actual_home_score,
                    away: match.actual_away_score,
                  };
                  const pointsData = calculatePoints(
                    { homeScore: prediction.home_score, awayScore: prediction.away_score },
                    actualResult
                  );
                  totalPoints += pointsData.points;
                }
              }
            }
            
            return { ...participant, totalPoints, matchesCount: finishedMatches };
          }).sort((a, b) => b.totalPoints - a.totalPoints);
        };
        
        // Сохраняем топы для всех трёх категорий
        const groupLeaders = calculatePointsForMatches(groupMatchesList);
        const playoffLeaders = calculatePointsForMatches(playoffMatchesList);
        const overallLeaders = calculatePointsForMatches(allMatchesList);
        
        // По умолчанию показываем общий топ
        setLeaders(overallLeaders.slice(0, 3));
        
        // Сохраняем все топы в объект для переключения
        setLeadersMap({
          group: groupLeaders,
          playoff: playoffLeaders,
          overall: overallLeaders,
        });
        
        // Ранг пользователя (общий по умолчанию)
        if (user) {
          const userStats = overallLeaders.find(p => p.user_id === user.id);
          if (userStats) {
            const position = overallLeaders.findIndex(p => p.user_id === user.id) + 1;
            setUserRank({ position, totalPoints: userStats.totalPoints, rankList: overallLeaders });
          }
        }
        
        // Сохраняем ранги для всех категорий
        setRanksMap({
          group: groupLeaders,
          playoff: playoffLeaders,
          overall: overallLeaders,
        });
        
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // СОСТОЯНИЯ ДЛЯ ТОПОВ
  // ============================================================

  const [leadersMap, setLeadersMap] = useState({ group: [], playoff: [], overall: [] });
  const [ranksMap, setRanksMap] = useState({ group: [], playoff: [], overall: [] });

  // Обновляем топ и ранг при смене вкладки
  useEffect(() => {
    if (Object.keys(leadersMap).length === 0) return;
    
    const tabKey = activeTab === 0 ? 'group' : activeTab === 1 ? 'playoff' : 'overall';
    const currentLeaders = leadersMap[tabKey] || [];
    const currentRanks = ranksMap[tabKey] || [];
    
    setLeaders(currentLeaders.slice(0, 3));
    
    if (user) {
      const userStats = currentLeaders.find(p => p.user_id === user.id);
      if (userStats) {
        const position = currentLeaders.findIndex(p => p.user_id === user.id) + 1;
        setUserRank({ position, totalPoints: userStats.totalPoints, rankList: currentLeaders });
      } else {
        setUserRank(null);
      }
    }
  }, [activeTab, leadersMap, ranksMap, user]);

  // ============================================================
  // ФУНКЦИЯ РАСЧЁТА ОЧКОВ
  // ============================================================

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

  // ============================================================
  // ФИЛЬТРАЦИЯ МАТЧЕЙ ПО ВКЛАДКЕ
  // ============================================================

  const groupMatches = allMatches.filter(m => getStageType(m.round_number) === 'group');
  console.log('groupMatches', groupMatches)
  const playoffMatches = allMatches.filter(m => getStageType(m.round_number) === 'playoff');

  const getUpcomingMatches = (matches) => {
    const now = new Date();
    const future = matches.filter(m => {
      const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
      return matchDate > now;
    });
    return future.sort((a, b) => {
      const dateA = new Date(`${a.match_date}T${a.match_time}Z`);
      const dateB = new Date(`${b.match_date}T${b.match_time}Z`);
      return dateA - dateB;
    }).slice(0, 4);
  };

  const displayedMatches = activeTab === 0 ? getUpcomingMatches(groupMatches) 
    : activeTab === 1 ? getUpcomingMatches(playoffMatches) 
    : getUpcomingMatches(allMatches);

  const getTabLabel = (matches) => {
    const now = new Date();
    const future = matches.filter(m => {
      const matchDate = new Date(`${m.match_date}T${m.match_time}Z`);
      return matchDate > now;
    });
    return future.length;
  };

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

  const renderMatchCard = (match) => {
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
  };

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
        <Button
          variant="outlined"
          startIcon={<InfoIcon />}
          onClick={() => setInfoOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          О турнире
        </Button>
      </Box>

      {/* 🔄 ВКЛАДКИ: ГРУППОВОЙ / ПЛЕЙ-ОФФ / ОБЩЕЕ */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 1.5,
              fontWeight: 600,
            }
          }}
        >
          <Tab 
            icon={<GroupWorkIcon />} 
            iconPosition="start"
            label={`Групповой (${getTabLabel(groupMatches)})`}
          />
          <Tab 
            icon={<EmojiEventsOutlinedIcon />} 
            iconPosition="start"
            label={`Плей-офф (${getTabLabel(playoffMatches)})`}
          />
          <Tab 
            icon={<DashboardIcon />} 
            iconPosition="start"
            label={`Общее (${getTabLabel(allMatches)})`}
          />
        </Tabs>
      </Paper>

      {/* ⭐ ТОП УЧАСТНИКОВ (МЕНЯЕТСЯ В ЗАВИСИМОСТИ ОТ ВКЛАДКИ) */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        🏆 Топ участников на {getTabTitle()}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {leaders.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {activeTab === 0 ? 'Нет данных о лидерах группового этапа' 
                  : activeTab === 1 ? 'Нет данных о лидерах плей-офф' 
                  : 'Нет данных о лидерах турнира'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          leaders.map((leader, idx) => (
            <Grid item xs={12} sm={4} key={leader.user_id || leader.display_name}>
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
                  {idx === 0 ? (
                    <EmojiEventsIcon sx={{ fontSize: 32, color: '#333' }} />
                  ) : idx === 1 ? (
                    <LooksTwoIcon sx={{ fontSize: 32, color: '#333' }} />
                  ) : (
                    <Looks3Icon sx={{ fontSize: 32, color: '#333' }} />
                  )}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{leader.display_name}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {leader.totalPoints}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  очков {activeTab === 0 ? '(группа)' : activeTab === 1 ? '(плей-офф)' : '(всего)'}
                </Typography>
                <Chip 
                  label={`${leader.matchesCount || 0} матчей`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, fontSize: '0.6rem' }}
                />
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* 📊 ПРОГРЕСС ПОЛЬЗОВАТЕЛЯ (МЕНЯЕТСЯ В ЗАВИСИМОСТИ ОТ ВКЛАДКИ) */}
      {user && userRank && (
        <Paper sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Ваше место {activeTab === 0 ? '(групповой этап)' : activeTab === 1 ? '(плей-офф)' : '(общее)'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {userRank.position} / {leaders.length}
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

      {/* 📅 БЛИЖАЙШИЕ МАТЧИ (фильтруются по вкладке) */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        <CalendarMonthIcon /> Ближайшие матчи 
        {activeTab === 0 && ' (групповой этап)'}
        {activeTab === 1 && ' (плей-офф)'}
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
        <Grid container spacing={2}>
          {displayedMatches.map(renderMatchCard)}
        </Grid>
      )}

      {/* 🚀 БЫСТРЫЙ ДОСТУП */}
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
          onClick={() => handleNavigate('stage-stats')}
        >
          Статистика
        </Button>
      </Box>

      <TournamentInfo open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Box>
  );
};

export default MatchList;