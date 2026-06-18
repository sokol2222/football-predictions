// src/components/Profile/MyPredictions.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../Auth/AuthButton';
import {
  getActiveTournament,
  getMatchesByTournamentAndRound,
  getRoundsByTournament,
  getUserPredictionsByRound,
  createPrediction,
  updatePrediction,
  isRoundOpen,
} from '../../services/api';
import { getStageLabel } from '../../utils/stageUtils';

// ============================================================
// КЛЮЧ ДЛЯ SESSIONSTORAGE
// ============================================================
const getStorageKey = (userId, roundNumber) => {
  return `draft_predictions_${userId || 'anonymous'}_round_${roundNumber || 'none'}`;
};

const MyPredictions = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  
  const [tournament, setTournament] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [pendingPredictions, setPendingPredictions] = useState({});
  const [roundStatus, setRoundStatus] = useState({ is_open: false, deadline: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // ============================================================
  // 📢 showSnackbar — ПЕРВЫМ ДЕЛОМ (до всех useCallback)
  // ============================================================
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ============================================================
  // 🎯 ЗАГРУЗКА ТУРНИРА И ТУРОВ
  // ============================================================
  const loadTournamentAndRounds = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: tournamentData } = await getActiveTournament();
      setTournament(tournamentData);
      
      if (tournamentData) {
        const { data: roundsData } = await getRoundsByTournament(tournamentData.id);
        setRounds(roundsData);
        
        const openRound = roundsData.find(r => r.is_open);
        const firstRound = roundsData[0];
        const initialRound = openRound?.round_number || firstRound?.round_number || null;
        setSelectedRound(initialRound);
      }
    } catch (error) {
      showSnackbar('Ошибка загрузки турнира', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ============================================================
  // 📥 ЗАГРУЗКА МАТЧЕЙ И ПРОГНОЗОВ С ВОССТАНОВЛЕНИЕМ ЧЕРНОВИКОВ
  // ============================================================
  // ============================================================
// 📥 ЗАГРУЗКА МАТЧЕЙ И ПРОГНОЗОВ (ОБНОВЛЁННАЯ)
// ============================================================
const loadMatchesAndPredictions = useCallback(async () => {
    if (!tournament || !selectedRound || !user) return;
    
    try {
      setLoading(true);
      
      const { data: matchesData } = await getMatchesByTournamentAndRound(tournament.id, selectedRound);
      setMatches(matchesData || []);
      
      const status = await isRoundOpen(tournament.id, selectedRound);
      setRoundStatus(status);
      
      // Загружаем сохранённые прогнозы из БД
      const { data: predictionsData } = await getUserPredictionsByRound(user.id, tournament.id, selectedRound);
      setPredictions(predictionsData);
      
      // 🔑 Проверяем наличие черновика в sessionStorage
      const storageKey = getStorageKey(user.id, selectedRound);
      const savedDraft = sessionStorage.getItem(storageKey);
      let savedPredictions = {};
      let hasDraft = false;
      
      if (savedDraft) {
        try {
          savedPredictions = JSON.parse(savedDraft);
          // ✅ Проверяем, что черновик содержит реальные данные (не пустой объект)
          hasDraft = Object.keys(savedPredictions).length > 0 && 
                    Object.values(savedPredictions).some(p => 
                      p.homeScore !== undefined && p.homeScore !== '' && 
                      p.awayScore !== undefined && p.awayScore !== ''
                    );
          setIsDraftRestored(hasDraft);
        } catch (e) {
          console.warn('Ошибка парсинга черновиков:', e);
          setIsDraftRestored(false);
        }
      } else {
        setIsDraftRestored(false);
      }

      // Формируем начальное состояние для pendingPredictions
      const initialPending = {};
      matchesData?.forEach(match => {
        const matchId = match.id;
        
        // Если есть черновик — используем его (приоритет)
        if (hasDraft && savedPredictions[matchId] !== undefined && savedPredictions[matchId] !== null) {
          initialPending[matchId] = savedPredictions[matchId];
        }
        // Иначе если есть сохранённый прогноз — используем его
        else if (predictionsData[matchId]) {
          initialPending[matchId] = {
            homeScore: predictionsData[matchId].home_score,
            awayScore: predictionsData[matchId].away_score,
          };
        }
      });
      
      setPendingPredictions(initialPending);
      
    } catch (error) {
      showSnackbar('Ошибка загрузки матчей', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tournament, selectedRound, user, getStorageKey, showSnackbar]);

  // ============================================================
  // 🔄 ЗАГРУЗКА ПРИ ИЗМЕНЕНИИ ЗАВИСИМОСТЕЙ
  // ============================================================
  useEffect(() => {
    if (user) {
      loadTournamentAndRounds();
    } else {
      setLoading(false);
    }
  }, [user, loadTournamentAndRounds]);

  useEffect(() => {
    if (user && tournament && selectedRound) {
      loadMatchesAndPredictions();
    }
  }, [user, tournament, selectedRound, loadMatchesAndPredictions]);

  // ============================================================
  // 💾 АВТОСОХРАНЕНИЕ ЧЕРНОВИКОВ В sessionStorage
  // ============================================================
  useEffect(() => {
    if (user && selectedRound) {
      const storageKey = getStorageKey(user.id, selectedRound);
      
      // Проверяем, есть ли реальные данные в pendingPredictions
      const hasRealData = Object.values(pendingPredictions).some(p => 
        p.homeScore !== undefined && p.homeScore !== '' && 
        p.awayScore !== undefined && p.awayScore !== ''
      );
      
      if (hasRealData) {
        // Сохраняем в sessionStorage
        sessionStorage.setItem(storageKey, JSON.stringify(pendingPredictions));
        
        // Проверяем, отличается ли черновик от сохранённых прогнозов
        let hasChanges = false;
        for (const [matchId, pending] of Object.entries(pendingPredictions)) {
          const saved = predictions[matchId];
          if (saved) {
            if (pending.homeScore !== saved.home_score || pending.awayScore !== saved.away_score) {
              hasChanges = true;
              break;
            }
          } else {
            // Если прогноз не сохранён, но есть данные — это тоже изменение
            if (pending.homeScore !== undefined && pending.homeScore !== '' && 
                pending.awayScore !== undefined && pending.awayScore !== '') {
              hasChanges = true;
              break;
            }
          }
        }
        
        // Устанавливаем флаг черновика, только если есть изменения
        setIsDraftRestored(hasChanges);
      } else {
        // Если нет данных — удаляем черновик
        sessionStorage.removeItem(storageKey);
        setIsDraftRestored(false);
      }
    }
  }, [pendingPredictions, user, selectedRound, getStorageKey, predictions]);

  // ============================================================
  // 🗑️ ОЧИСТКА ЧЕРНОВИКОВ
  // ============================================================
  const clearDraft = useCallback(() => {
    if (user && selectedRound) {
      // 1. Удаляем из sessionStorage
      const storageKey = getStorageKey(user.id, selectedRound);
      sessionStorage.removeItem(storageKey);
      
      // 2. ✅ Сбрасываем флаг черновика
      setIsDraftRestored(false);
      
      // 3. Сбрасываем pendingPredictions до состояния из БД
      const resetPending = {};
      matches.forEach(match => {
        const existing = predictions[match.id];
        if (existing) {
          resetPending[match.id] = {
            homeScore: existing.home_score,
            awayScore: existing.away_score,
          };
        }
      });
      setPendingPredictions(resetPending);
      
      showSnackbar('🗑️ Черновик очищен', 'info');
    }
  }, [user, selectedRound, matches, predictions, getStorageKey, showSnackbar]);

  // ============================================================
// ✅ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: если прогнозы сохранены — убираем черновик
// ============================================================
useEffect(() => {
  if (user && selectedRound && isDraftRestored) {
    const storageKey = getStorageKey(user.id, selectedRound);
    const savedDraft = sessionStorage.getItem(storageKey);
    
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        let hasChanges = false;
        
        // Проверяем, есть ли различия между черновиком и сохранёнными прогнозами
        for (const [matchId, draft] of Object.entries(draftData)) {
          const saved = predictions[matchId];
          if (saved) {
            if (draft.homeScore !== saved.home_score || draft.awayScore !== saved.away_score) {
              hasChanges = true;
              break;
            }
          } else {
            // Если прогноз не сохранён, но есть данные
            if (draft.homeScore !== undefined && draft.homeScore !== '' && 
                draft.awayScore !== undefined && draft.awayScore !== '') {
              hasChanges = true;
              break;
            }
          }
        }
        
        // Если изменений нет — удаляем черновик
        if (!hasChanges) {
          sessionStorage.removeItem(storageKey);
          setIsDraftRestored(false);
        }
      } catch (e) {
        console.warn('Ошибка проверки черновика:', e);
      }
    }
  }
}, [predictions, user, selectedRound, isDraftRestored, getStorageKey]);

  // ============================================================
  // 💾 СОХРАНЕНИЕ ПРОГНОЗОВ В БД
  // ============================================================
  const handleSaveRound = useCallback(async () => {
    if (!roundStatus.is_open) {
      showSnackbar('❌ Невозможно сохранить: дедлайн прошёл', 'error');
      return;
    }
    
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;
    const savedMatchIds = [];

    for (const [matchId, pending] of Object.entries(pendingPredictions)) {
      const match = matches.find(m => m.id === Number(matchId));
      if (!match) continue;
      
      // Пропускаем пустые прогнозы
      if (pending.homeScore === undefined || pending.awayScore === undefined || 
          pending.homeScore === '' || pending.awayScore === '') {
        continue;
      }
      
      try {
        const existing = predictions[matchId];
        
        if (existing) {
          await updatePrediction(existing.id, {
            homeScore: pending.homeScore,
            awayScore: pending.awayScore,
          });
        } else {
          await createPrediction({
            matchId: Number(matchId),
            homeScore: pending.homeScore,
            awayScore: pending.awayScore,
            matchName: `${match.home_team} — ${match.away_team}`,
            tournamentId: tournament?.id,
          });
        }
        successCount++;
        savedMatchIds.push(matchId);
      } catch (error) {
        errorCount++;
        console.error('Ошибка сохранения:', error);
      }
    }
    
    // ✅ Очищаем черновики после успешного сохранения
    if (successCount > 0) {
      clearDraft();
      
      // Удаляем сохранённые прогнозы из pending (чтобы они не дублировались)
      setPendingPredictions(prev => {
        const newPending = { ...prev };
        savedMatchIds.forEach(id => {
          delete newPending[id];
        });
        return newPending;
      });
      
      showSnackbar(
        `✅ Сохранено ${successCount} прогнозов${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`, 
        errorCount > 0 ? 'warning' : 'success'
      );
      
      // Перезагружаем данные
      await loadMatchesAndPredictions();
    } else if (errorCount > 0) {
      showSnackbar(`❌ Ошибка при сохранении ${errorCount} прогнозов`, 'error');
    } else {
      showSnackbar('⚠️ Нет заполненных прогнозов для сохранения', 'warning');
    }
    
    setSaving(false);
  }, [pendingPredictions, predictions, matches, tournament, roundStatus.is_open, loadMatchesAndPredictions, clearDraft]);

  // ============================================================
  // 🎛️ ОБРАБОТЧИКИ ИЗМЕНЕНИЙ
  // ============================================================
  const handlePredictionChange = useCallback((matchId, type, value) => {
    if (!roundStatus.is_open) return;
    
    setPendingPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: value === '' ? '' : Number(value),
      },
    }));
  }, [roundStatus.is_open]);

  // ============================================================
  // 🔄 ОБРАБОТКА СМЕНЫ ТУРА
  // ============================================================
  const handleRoundChange = useCallback((newRound) => {
    // Сохраняем черновики перед переключением
    if (user && selectedRound && Object.keys(pendingPredictions).length > 0) {
      const storageKey = getStorageKey(user.id, selectedRound);
      sessionStorage.setItem(storageKey, JSON.stringify(pendingPredictions));
    }
    setSelectedRound(newRound);
  }, [user, selectedRound, pendingPredictions]);

  // ============================================================
  // 📊 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================================

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' });
  }, []);

  const formatTime = useCallback((timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  }, []);

  const formatDeadline = useCallback((deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const filledCount = useMemo(() => {
    return Object.values(pendingPredictions).filter(p => 
      p.homeScore !== undefined && p.homeScore !== '' && 
      p.awayScore !== undefined && p.awayScore !== ''
    ).length;
  }, [pendingPredictions]);

  const totalMatches = matches.length;

  // ============================================================
  // 🖼️ РЕНДЕР
  // ============================================================

  // Если пользователь не авторизован
  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          🔒 Требуется авторизация
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Чтобы делать прогнозы, войдите или зарегистрируйтесь
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => showAuthModal(0)}
        >
          Войти / Регистрация
        </Button>
      </Box>
    );
  }

  if (loading && !matches.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          🏆 Нет активного турнира
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Дождитесь начала турнира или обратитесь к администратору
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 700 }}>
        📝 Мои прогнозы
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {tournament.name} {tournament.year}
      </Typography>

      {/* Выбор тура */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedRound}
          onChange={(e, newValue) => handleRoundChange(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {rounds.map(round => {
            //const hasDraft = user && sessionStorage.getItem(getStorageKey(user.id, round.round_number));
            return (
              <Tab
                key={round.round_number}
                value={round.round_number}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{getStageLabel(round.round_number)}</span>
                    {!round.is_open && round.deadline && (
                      <LockIcon fontSize="small" color="disabled" />
                    )}
                    {/*{hasDraft && (
                      <Chip 
                        label="*" 
                        size="small" 
                        color="warning" 
                        sx={{ width: 20, height: 20, '& .MuiChip-label': { px: 0, fontSize: 12 } }}
                      />
                    )}*/}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Статус тура */}
      <Alert 
        severity={roundStatus.is_open ? 'info' : 'warning'}
        icon={roundStatus.is_open ? <ScheduleIcon /> : <WarningIcon />}
        sx={{ mb: 3 }}
      >
        {roundStatus.is_open 
          ? `Приём прогнозов до ${formatDeadline(roundStatus.deadline)}`
          : `Дедлайн тура прошёл ${formatDeadline(roundStatus.deadline)}. Прогнозы больше не принимаются.`
        }
        {roundStatus.is_open && (
          <Chip 
            label={`Прогнозов: ${filledCount}/${totalMatches}`}
            size="small"
            color="primary"
            sx={{ ml: 2 }}
          />
        )}
        {isDraftRestored && (
          <Chip 
            label="📝 Есть черновик"
            size="small"
            color="warning"
            sx={{ ml: 2 }}
            onClick={() => {
              const storageKey = getStorageKey(user.id, selectedRound);
              sessionStorage.removeItem(storageKey);
              setIsDraftRestored(false);
              loadMatchesAndPredictions();
            }}
          />
        )}
      </Alert>

      {/* Таблица матчей */}
      {matches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Нет матчей в этом туре
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Дата</b></TableCell>
                <TableCell><b>Матч</b></TableCell>
                <TableCell><b>Стадион</b></TableCell>
                <TableCell align="center" colSpan={2}><b>Мой прогноз</b></TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell align="center"><b>Хозяева</b></TableCell>
                <TableCell align="center"><b>Гости</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((match) => {
                const pending = pendingPredictions[match.id] || {};
                const isDisabled = !roundStatus.is_open;
                const isSaved = predictions[match.id] !== undefined;
                const isModified = isSaved && (
                  pending.homeScore !== predictions[match.id].home_score ||
                  pending.awayScore !== predictions[match.id].away_score
                );
                
                return (
                  <TableRow key={match.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatDate(match.match_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(match.match_time)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      {match.home_team_code && match.away_team_code && (
                        <Typography variant="caption" color="text.secondary">
                          ({match.home_team_code} - {match.away_team_code})
                        </Typography>
                      )}
                      {isSaved && (
                        <Chip 
                          label={isModified ? '✏️ Изменён' : '✅ Сохранён'}
                          size="small"
                          color={isModified ? 'warning' : 'success'}
                          sx={{ ml: 1, height: 20, '& .MuiChip-label': { fontSize: 10, px: 1 } }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {match.stadium || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={pending.homeScore !== undefined ? pending.homeScore : ''}
                        onChange={(e) => handlePredictionChange(match.id, 'homeScore', e.target.value)}
                        disabled={isDisabled}
                        inputProps={{ 
                          min: 0, 
                          max: 20, 
                          style: { textAlign: 'center', width: '60px' } 
                        }}
                        placeholder="—"
                        sx={{
                          '& input': { 
                            fontWeight: isModified ? 'bold' : 'normal',
                            color: isModified ? theme.palette.warning.main : 'inherit',
                            fontSize: '16px' 
                          },
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={pending.awayScore !== undefined ? pending.awayScore : ''}
                        onChange={(e) => handlePredictionChange(match.id, 'awayScore', e.target.value)}
                        disabled={isDisabled}
                        inputProps={{ 
                          min: 0, 
                          max: 20, 
                          style: { textAlign: 'center', width: '60px' } 
                        }}
                        placeholder="—"
                        sx={{
                          '& input': { 
                            fontWeight: isModified ? 'bold' : 'normal',
                            color: isModified ? theme.palette.warning.main : 'inherit',
                            fontSize: '16px' 
                          },
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Кнопка сохранения */}
      {roundStatus.is_open && matches.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {isDraftRestored && (
            <Button
              variant="outlined"
              color="warning"
              onClick={clearDraft}
              disabled={saving}
            >
              🗑️ Очистить черновик
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSaveRound}
            disabled={saving || filledCount === 0}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              borderRadius: 3,
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.2s',
            }}
          >
            {saving ? 'Сохранение...' : `Сохранить прогнозы (${filledCount}/${totalMatches})`}
          </Button>
        </Box>
      )}

      {/* Ближайшие дедлайны */}
      {rounds.filter(r => !r.is_closed && r.round_number !== selectedRound).length > 0 && (
        <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              Ближайшие дедлайны
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {rounds
                .filter(r => !r.is_closed && r.round_number !== selectedRound)
                .slice(0, 3)
                .map(round => {
                  const isPast = new Date() > new Date(round.deadline);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={round.round_number}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          borderColor: round.round_number === selectedRound ? 'primary.main' : 'divider',
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {getStageLabel(round.round_number)}
                        </Typography>
                        <Typography variant="body2" color={isPast ? 'error' : 'text.secondary'}>
                          {isPast ? 'Дедлайн прошёл' : `До ${formatDeadline(round.deadline)}`}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyPredictions;