import { supabase } from '../lib/supabase';

// Проверка инвайт-кода (только существование)
export const verifyInviteCode = async (code) => {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('code, expires_at')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  
  if (error || !data) {
    return { valid: false, message: 'Неверный код приглашения' };
  }
  
  // Проверяем срок действия
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'Срок действия кода истёк' };
  }
  
  return { valid: true };
};