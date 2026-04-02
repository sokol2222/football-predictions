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
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    
    // Если пользователь не авторизован, используем "Аноним"
    const friendName = user?.email?.split('@')[0] || 'Аноним';
    const userId = user?.id || null;

    const { data, error } = await supabase
      .from('predictions')
      .insert([{
        match_id: predictionData.matchId,
        home_score: predictionData.homeScore,
        away_score: predictionData.awayScore,
        match_name: predictionData.matchName,
        friend_name: friendName,
        user_id: userId
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
  const { data, error } = await supabase
    .from('predictions')
    .update({ 
      home_score: homeScore, 
      away_score: awayScore,
      updated_at: new Date()
    })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return { data };
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
export const getUserPredictionsForTournament = async (userId, tournamentId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, matches!inner(*)')
    .eq('user_id', userId)
    .eq('matches.tournament_id', tournamentId);
  
  if (error) throw error;
  return { data };
};