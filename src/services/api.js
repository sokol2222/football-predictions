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