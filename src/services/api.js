import { supabase } from '../lib/supabase';

// Получить все прогнозы
export const getPredictions = async () => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Ошибка загрузки:', error);
    throw error;
  }
  
  return { data };
};

// Получить прогнозы по матчу
export const getMatchPredictions = async (matchId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return { data };
};

// Создать прогноз
export const createPrediction = async (predictionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const friendName = user?.email?.split('@')[0] || 'Аноним';
    const userId = user?.id || null;
    
    // Получаем результат матча (если матч уже завершён)
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', predictionData.matchId)
      .single();
    
    let pointsData = {
      points_earned: 0,
      is_exact_score: false,
      is_exact_difference: false,
      is_correct_result: false,
    };
    
    // Если матч уже завершён, рассчитываем очки
    if (match?.is_finished && match.actual_home_score !== null) {
      pointsData = calculatePointsForPrediction(
        { homeScore: predictionData.homeScore, awayScore: predictionData.awayScore },
        match
      );
    }
    
    const { data, error } = await supabase
      .from('predictions')
      .insert([{
        match_id: predictionData.matchId,
        home_score: predictionData.homeScore,
        away_score: predictionData.awayScore,
        match_name: predictionData.matchName,
        friend_name: friendName,
        user_id: userId,
        tournament_id: predictionData.tournamentId,
        points_earned: pointsData.points_earned,
        is_exact_score: pointsData.is_exact_score,
        is_exact_difference: pointsData.is_exact_difference,
        is_correct_result: pointsData.is_correct_result,
      }])
      .select();

    if (error) throw error;
    return { data };
    
  } catch (error) {
    console.error('Ошибка создания прогноза:', error);
    throw error;
  }
};

export const updatePrediction = async (id, { homeScore, awayScore }) => {
  try {
    // Получаем прогноз и связанный матч
    const { data: prediction } = await supabase
      .from('predictions')
      .select('*, matches(*)')
      .eq('id', id)
      .single();
    
    let pointsData = {
      points_earned: prediction?.points_earned || 0,
      is_exact_score: prediction?.is_exact_score || false,
      is_exact_difference: prediction?.is_exact_difference || false,
      is_correct_result: prediction?.is_correct_result || false,
    };
    
    // Если матч завершён, пересчитываем очки
    if (prediction?.matches?.is_finished && prediction.matches.actual_home_score !== null) {
      pointsData = calculatePointsForPrediction(
        { homeScore, awayScore },
        prediction.matches
      );
    }
    
    const { data, error } = await supabase
      .from('predictions')
      .update({ 
        home_score: homeScore, 
        away_score: awayScore,
        points_earned: pointsData.points_earned,
        is_exact_score: pointsData.is_exact_score,
        is_exact_difference: pointsData.is_exact_difference,
        is_correct_result: pointsData.is_correct_result,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data };
    
  } catch (error) {
    console.error('Ошибка обновления прогноза:', error);
    throw error;
  }
};

// Удалить прогноз
export const deletePrediction = async (id) => {
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
};

// ========== МАТЧИ ==========

// Получить все матчи турнира
export const getMatches = async (tournamentId = null) => {
  let query = supabase.from('matches').select('*');
  
  if (tournamentId) {
    query = query.eq('tournament_id', tournamentId);
  }
  
  const { data, error } = await query.order('match_date', { ascending: true });
  
  if (error) throw error;
  return { data };
};

// Получить матчи по этапу и туру
export const getMatchesByStageAndRound = async (stageId, roundNumber = null) => {
  let query = supabase
    .from('matches')
    .select('*')
    .eq('stage_id', stageId);
  
  if (roundNumber) {
    query = query.eq('round_number', roundNumber);
  }
  
  const { data, error } = await query.order('match_date', { ascending: true });
  
  if (error) throw error;
  return { data };
};

// Получить матчи по турниру и туру
export const getMatchesByTournamentAndRound = async (tournamentId, roundNumber) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('round_number', roundNumber)
    .order('match_date', { ascending: true });
  
  if (error) throw error;
  return { data };
};

// Получить матч по ID
export const getMatchById = async (matchId) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  
  if (error) throw error;
  return { data };
};

// ========== ТУРНИРЫ ==========

// Получить активный турнир
export const getActiveTournament = async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) throw error;
  return { data };
};

// Получить все турниры
export const getAllTournaments = async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('year', { ascending: false });
  
  if (error) throw error;
  return { data };
};

// ========== ЭТАПЫ (STAGES) ==========

// Получить этапы турнира
export const getStagesByTournament = async (tournamentId) => {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('order_number', { ascending: true });
  
  if (error) throw error;
  return { data };
};

// Получить этап по ID
export const getStageById = async (stageId) => {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('id', stageId)
    .single();
  
  if (error) throw error;
  return { data };
};

// ========== СТАТУС ТУРА ==========

// Проверить, открыт ли тур для прогнозов
export const isRoundOpen = async (tournamentId, roundNumber) => {
  const { data, error } = await supabase
    .from('matches')
    .select('round_deadline, round_is_closed')
    .eq('tournament_id', tournamentId)
    .eq('round_number', roundNumber)
    .limit(1)
    .single();
  
  if (error) {
    // Если нет информации о дедлайне, считаем тур открытым
    if (error.code === 'PGRST116') return { is_open: true };
    throw error;
  }
  
  const isOpen = !data?.round_is_closed && new Date() < new Date(data?.round_deadline);
  
  return { 
    is_open: isOpen,
    deadline: data?.round_deadline,
    is_closed: data?.round_is_closed
  };
};

// Получить все уникальные туры турнира
export const getRoundsByTournament = async (tournamentId) => {
  const { data, error } = await supabase
    .from('matches')
    .select('round_number, round_deadline, round_is_closed')
    .eq('tournament_id', tournamentId)
    .not('round_number', 'is', null)
    .order('round_number', { ascending: true });
  
  if (error) throw error;
  
  // Уникальные туры
  const uniqueRounds = [...new Map(data.map(m => [m.round_number, m])).values()];
  
  // Добавляем статус открытости
  const roundsWithStatus = uniqueRounds.map(round => ({
    round_number: round.round_number,
    deadline: round.round_deadline,
    is_closed: round.round_is_closed,
    is_open: !round.round_is_closed && new Date() < new Date(round.round_deadline)
  }));
  
  return { data: roundsWithStatus };
};

// ========== УЧАСТНИКИ ==========
export const getTournamentParticipants = async (tournamentId) => {
   const { data, error } = await supabase
    .from('tournament_participants')
    .select('id, user_id, tournament_id, display_name, avatar_url, joined_at')
    .eq('tournament_id', tournamentId);

  if (error) throw error;
  
  // Преобразуем данные в удобный формат
  const participants = data.map(p => ({
    id: p.id,
    user_id: p.user_id,
    tournament_id: p.tournament_id,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    joined_at: p.joined_at,
    email: p.display_name,
  }));
  
  return { data: participants };
};

export const addTournamentParticipant = async (tournamentId, userId, displayName) => {
  const { data, error } = await supabase
    .from('tournament_participants')
    .insert([{
      tournament_id: tournamentId,
      user_id: userId,
      display_name: displayName,
    }])
    .select();
  
  if (error) throw error;
  return { data };
};

export const removeTournamentParticipant = async (participantId) => {
  const { error } = await supabase
    .from('tournament_participants')
    .delete()
    .eq('id', participantId);
  
  if (error) throw error;
  return { success: true };
};

// ========== ПРОГНОЗЫ ДЛЯ ВИРТУАЛЬНЫХ УЧАСТНИКОВ ==========

// Получить прогнозы по friend_name (для виртуальных участников)
export const getPredictionsByFriendName = async (friendName, tournamentId) => {
  if (!friendName) return { data: [] };
  
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('friend_name', friendName)
    .eq('tournament_id', tournamentId);
  
  if (error) {
    console.error('Ошибка загрузки прогнозов по friend_name:', error);
    return { data: [] };
  }
  
  return { data };
};

// Универсальная функция получения прогнозов участника (по user_id или friend_name)
export const getParticipantPredictions = async (participant, tournamentId) => {
  if (!participant) return { data: [] };
  
  if (participant.user_id) {
    return await getUserPredictionsForTournament(participant.user_id, tournamentId);
  } else if (participant.display_name) {
    return await getUserPredictionsForTournament(null, tournamentId, participant.display_name);
  }
  
  return { data: [] };
};

// ========== ПРОГНОЗЫ ПОЛЬЗОВАТЕЛЯ (расширенные) ==========

// Получить прогнозы пользователя на тур
export const getUserPredictionsByRound = async (userId, tournamentId, roundNumber) => {
  // Сначала получаем матчи тура
  const { data: matches } = await getMatchesByTournamentAndRound(tournamentId, roundNumber);
  const matchIds = matches.map(m => m.id);
  
  if (matchIds.length === 0) return { data: [] };
  
  // Затем прогнозы пользователя
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .in('match_id', matchIds);
  
  if (error) throw error;
  
  // Преобразуем в объект для удобного доступа
  const predictionsMap = {};
  data.forEach(p => {
    predictionsMap[p.match_id] = p;
  });
  
  return { data: predictionsMap };
};

// Получить все прогнозы пользователя на турнир
// Получить все прогнозы пользователя на турнир
export const getUserPredictionsForTournament = async (userId, tournamentId, friendName = null) => {
    try {
      // 1. Сначала получаем все матчи турнира
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, round_number, home_team, away_team, match_date, is_finished, actual_home_score, actual_away_score')
        .eq('tournament_id', tournamentId);
      
      if (matchesError) throw matchesError;
      if (!matches || matches.length === 0) return { data: [] };
      
      const matchIds = matches.map(m => m.id);
      
      // 2. Получаем прогнозы — если userId есть, ищем по user_id, иначе по friend_name
      let query = supabase
        .from('predictions')
        .select('*')
        .eq('tournament_id', tournamentId)
        .in('match_id', matchIds);
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (friendName) {
        query = query.eq('friend_name', friendName);
      } else {
        // Если нет ни userId, ни friendName — возвращаем пустой массив
        return { data: [] };
      }
      
      const { data: predictions, error: predictionsError } = await query;
      
      if (predictionsError) throw predictionsError;
      
      // 3. Обогащаем прогнозы информацией о матчах
      const enrichedPredictions = (predictions || []).map(prediction => {
        const match = matches.find(m => m.id === prediction.match_id);
        return {
          ...prediction,
          round_number: match?.round_number,
          home_team: match?.home_team,
          away_team: match?.away_team,
          match_date: match?.match_date,
          is_finished: match?.is_finished,
          actual_home_score: match?.actual_home_score,
          actual_away_score: match?.actual_away_score,
        };
      });
      
      return { data: enrichedPredictions };
      
    } catch (error) {
      console.error('Ошибка в getUserPredictionsForTournament:', error);
      return { data: [] };
    }
  };

// Получить статистику пользователя по турниру
export const getUserTournamentStats = async (userId, tournamentId) => {
  try {
    const { data: predictions } = await getUserPredictionsForTournament(userId, tournamentId);
    
    const totalPredictions = predictions?.length || 0;
    const exactScores = predictions?.filter(p => p.is_exact_score).length || 0;
    const correctResults = predictions?.filter(p => p.is_correct_result).length || 0;
    const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned || 0), 0) || 0;
    
    // Прогнозы по турам
    const byRound = {};
    predictions?.forEach(p => {
      const round = p.round_number;
      if (round) {
        if (!byRound[round]) {
          byRound[round] = { total: 0, points: 0, exact: 0 };
        }
        byRound[round].total++;
        byRound[round].points += p.points_earned || 0;
        if (p.is_exact_score) byRound[round].exact++;
      }
    });
    
    return {
      data: {
        totalPredictions,
        exactScores,
        correctResults,
        totalPoints,
        accuracy: totalPredictions > 0 ? Math.round((correctResults / totalPredictions) * 100) : 0,
        byRound,
      }
    };
  } catch (error) {
    console.error('Ошибка в getUserTournamentStats:', error);
    return { data: null };
  }
};

export const calculatePointsForPrediction = (prediction, actualResult) => {
  let points = 0;
  let isExactScore = false;
  let isExactDifference = false;
  let isCorrectResult = false;
  
  const homeScore = prediction.homeScore;
  const awayScore = prediction.awayScore;
  const actualHome = actualResult.actual_home_score;
  const actualAway = actualResult.actual_away_score;
  
  // 1. Точный счёт (3 очка)
  if (homeScore === actualHome && awayScore === actualAway) {
    points += 3;
    isExactScore = true;
  }
  
  // 2. Разница голов (1 очко, если не точный счёт)
  const predDiff = homeScore - awayScore;
  const actualDiff = actualHome - actualAway;
  if (predDiff === actualDiff && !isExactScore && actualDiff !== 0) {
    points += 1;
    isExactDifference = true;
  }
  
  // 3. Угадан исход (1 очко, если не точный счёт и не угадана разница)
  const getOutcome = (home, away) => {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  };
  
  const predOutcome = getOutcome(homeScore, awayScore);
  const actualOutcome = getOutcome(actualHome, actualAway);
  
  if (predOutcome === actualOutcome && !isExactScore && !isExactDifference) {
    points += 1;
    isCorrectResult = true;
  }
  
  return { points, isExactScore, isExactDifference, isCorrectResult };
};