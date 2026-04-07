// scripts/importWorldCup.js
// Запуск: node scripts/importWorldCup.js

import { supabase } from './src/lib/supabase.node.js';



// ========== ДАННЫЕ ТУРНИРА ==========
const tournamentData = {
  name: 'Чемпионат мира по футболу',
  year: 2026,
  description: 'ЧМ-2026 в США, Канаде и Мексике. 48 команд, 104 матча.',
  start_date: '2026-06-11',
  end_date: '2026-07-19',
  is_active: true,
};

// ========== ЭТАПЫ ТУРНИРА ==========
const stagesData = [
  { name: 'Групповой этап', name_short: 'Группа', order_number: 1, match_count: 72, points_exact_score: 3, points_exact_difference: 1, points_correct_result: 1 },
  { name: '1/32 финала', name_short: '1/32', order_number: 2, match_count: 16, points_exact_score: 4, points_exact_difference: 1, points_correct_result: 1 },
  { name: '1/16 финала', name_short: '1/16', order_number: 3, match_count: 16, points_exact_score: 4, points_exact_difference: 1, points_correct_result: 1 },
  { name: '1/8 финала', name_short: '1/8', order_number: 4, match_count: 8, points_exact_score: 5, points_exact_difference: 1, points_correct_result: 1 },
  { name: 'Четвертьфинал', name_short: '1/4', order_number: 5, match_count: 4, points_exact_score: 5, points_exact_difference: 1, points_correct_result: 1 },
  { name: 'Полуфинал', name_short: '1/2', order_number: 6, match_count: 2, points_exact_score: 6, points_exact_difference: 1, points_correct_result: 1 },
  { name: 'Финал', name_short: 'Финал', order_number: 7, match_count: 1, points_exact_score: 8, points_exact_difference: 1, points_correct_result: 1 },
];

// ========== КОДЫ КОМАНД ==========
const teamCodes = {
  'Мексика': 'MEX', 'ЮАР': 'RSA', 'Южная Корея': 'KOR', 'Чехия': 'CZE',
  'Канада': 'CAN', 'Босния и Герцеговина': 'BIH', 'Катар': 'QAT', 'Швейцария': 'SUI',
  'Бразилия': 'BRA', 'Марокко': 'MAR', 'Гаити': 'HAI', 'Шотландия': 'SCO',
  'США': 'USA', 'Парагвай': 'PAR', 'Австралия': 'AUS', 'Турция': 'TUR',
  'Германия': 'GER', 'Кюрасао': 'CUW', 'Кот-д\'Ивуар': 'CIV', 'Эквадор': 'ECU',
  'Нидерланды': 'NED', 'Япония': 'JPN', 'Швеция': 'SWE', 'Тунис': 'TUN',
  'Бельгия': 'BEL', 'Египет': 'EGY', 'Иран': 'IRN', 'Новая Зеландия': 'NZL',
  'Испания': 'ESP', 'Кабо-Верде': 'CPV', 'Саудовская Аравия': 'KSA', 'Уругвай': 'URU',
  'Франция': 'FRA', 'Сенегал': 'SEN', 'Ирак': 'IRQ', 'Норвегия': 'NOR',
  'Аргентина': 'ARG', 'Алжир': 'ALG', 'Австрия': 'AUT', 'Иордания': 'JOR',
  'Португалия': 'POR', 'ДР Конго': 'COD', 'Узбекистан': 'UZB', 'Колумбия': 'COL',
  'Англия': 'ENG', 'Хорватия': 'CRO', 'Гана': 'GHA', 'Панама': 'PAN',
};

// ========== МАТЧИ ГРУППОВОГО ЭТАПА (МОСКОВСКОЕ ВРЕМЯ) ==========
const groupMatches = [
  // ========== ГРУППА A ==========
  { group: 'A', round: 1, home: 'Мексика', away: 'ЮАР', date: '2026-06-11', time: '22:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { group: 'A', round: 1, home: 'Южная Корея', away: 'Чехия', date: '2026-06-12', time: '19:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  //{ group: 'A', round: 2, home: 'Чехия', away: 'ЮАР', date: '2026-06-18', time: '22:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  //{ group: 'A', round: 2, home: 'Мексика', away: 'Южная Корея', date: '2026-06-19', time: '04:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  //{ group: 'A', round: 3, home: 'Южная Корея', away: 'ЮАР', date: '2026-06-25', time: '02:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  //{ group: 'A', round: 3, home: 'Чехия', away: 'Мексика', date: '2026-06-25', time: '02:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
/* 
  // ========== ГРУППА B ==========
  { group: 'B', round: 1, home: 'Канада', away: 'Босния и Герцеговина', date: '2026-06-12', time: '22:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { group: 'B', round: 1, home: 'Катар', away: 'Швейцария', date: '2026-06-13', time: '04:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { group: 'B', round: 2, home: 'Швейцария', away: 'Босния и Герцеговина', date: '2026-06-19', time: '01:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { group: 'B', round: 2, home: 'Катар', away: 'Канада', date: '2026-06-19', time: '04:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { group: 'B', round: 3, home: 'Босния и Герцеговина', away: 'Катар', date: '2026-06-25', time: '04:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { group: 'B', round: 3, home: 'Швейцария', away: 'Канада', date: '2026-06-25', time: '04:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },

  // ========== ГРУППА C ==========
  { group: 'C', round: 1, home: 'Бразилия', away: 'Марокко', date: '2026-06-13', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { group: 'C', round: 1, home: 'Гаити', away: 'Шотландия', date: '2026-06-14', time: '01:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { group: 'C', round: 2, home: 'Шотландия', away: 'Бразилия', date: '2026-06-20', time: '01:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { group: 'C', round: 2, home: 'Марокко', away: 'Гаити', date: '2026-06-20', time: '04:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { group: 'C', round: 3, home: 'Бразилия', away: 'Гаити', date: '2026-06-26', time: '02:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { group: 'C', round: 3, home: 'Шотландия', away: 'Марокко', date: '2026-06-26', time: '02:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },

  // ========== ГРУППА D ==========
  { group: 'D', round: 1, home: 'США', away: 'Парагвай', date: '2026-06-13', time: '07:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { group: 'D', round: 1, home: 'Австралия', away: 'Турция', date: '2026-06-14', time: '06:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { group: 'D', round: 2, home: 'Турция', away: 'США', date: '2026-06-20', time: '07:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { group: 'D', round: 2, home: 'Парагвай', away: 'Австралия', date: '2026-06-21', time: '01:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  { group: 'D', round: 3, home: 'США', away: 'Австралия', date: '2026-06-26', time: '04:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { group: 'D', round: 3, home: 'Турция', away: 'Парагвай', date: '2026-06-26', time: '04:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },

  // ========== ГРУППА E ==========
  { group: 'E', round: 1, home: 'Германия', away: 'Кюрасао', date: '2026-06-14', time: '23:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { group: 'E', round: 1, home: 'Кот-д\'Ивуар', away: 'Эквадор', date: '2026-06-15', time: '05:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { group: 'E', round: 2, home: 'Эквадор', away: 'Германия', date: '2026-06-21', time: '05:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { group: 'E', round: 2, home: 'Кюрасао', away: 'Кот-д\'Ивуар', date: '2026-06-21', time: '23:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { group: 'E', round: 3, home: 'Германия', away: 'Кот-д\'Ивуар', date: '2026-06-27', time: '02:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { group: 'E', round: 3, home: 'Эквадор', away: 'Кюрасао', date: '2026-06-27', time: '02:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },

  // ========== ГРУППА F ==========
  { group: 'F', round: 1, home: 'Нидерланды', away: 'Япония', date: '2026-06-14', time: '20:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { group: 'F', round: 1, home: 'Швеция', away: 'Тунис', date: '2026-06-15', time: '08:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  { group: 'F', round: 2, home: 'Тунис', away: 'Нидерланды', date: '2026-06-21', time: '22:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { group: 'F', round: 2, home: 'Япония', away: 'Швеция', date: '2026-06-22', time: '01:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { group: 'F', round: 3, home: 'Нидерланды', away: 'Швеция', date: '2026-06-27', time: '04:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { group: 'F', round: 3, home: 'Тунис', away: 'Япония', date: '2026-06-27', time: '04:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },

  // ========== ГРУППА G ==========
  { group: 'G', round: 1, home: 'Бельгия', away: 'Египет', date: '2026-06-16', time: '01:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { group: 'G', round: 1, home: 'Иран', away: 'Новая Зеландия', date: '2026-06-16', time: '07:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { group: 'G', round: 2, home: 'Бельгия', away: 'Иран', date: '2026-06-22', time: '01:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { group: 'G', round: 2, home: 'Новая Зеландия', away: 'Египет', date: '2026-06-22', time: '07:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { group: 'G', round: 3, home: 'Новая Зеландия', away: 'Бельгия', date: '2026-06-27', time: '06:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { group: 'G', round: 3, home: 'Египет', away: 'Иран', date: '2026-06-27', time: '06:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },

  // ========== ГРУППА H ==========
  { group: 'H', round: 1, home: 'Испания', away: 'Кабо-Верде', date: '2026-06-15', time: '22:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { group: 'H', round: 1, home: 'Саудовская Аравия', away: 'Уругвай', date: '2026-06-16', time: '01:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { group: 'H', round: 2, home: 'Уругвай', away: 'Испания', date: '2026-06-22', time: '04:00:00', stadium: 'Levi\'s Stadium', city: 'Санта-Клара', country: 'США' },
  { group: 'H', round: 2, home: 'Кабо-Верде', away: 'Саудовская Аравия', date: '2026-06-22', time: '22:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { group: 'H', round: 3, home: 'Испания', away: 'Саудовская Аравия', date: '2026-06-28', time: '02:00:00', stadium: 'Levi\'s Stadium', city: 'Санта-Клара', country: 'США' },
  { group: 'H', round: 3, home: 'Уругвай', away: 'Кабо-Верде', date: '2026-06-28', time: '02:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },

  // ========== ГРУППА I ==========
  { group: 'I', round: 1, home: 'Франция', away: 'Сенегал', date: '2026-06-16', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { group: 'I', round: 1, home: 'Ирак', away: 'Норвегия', date: '2026-06-17', time: '01:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { group: 'I', round: 2, home: 'Норвегия', away: 'Франция', date: '2026-06-23', time: '01:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { group: 'I', round: 2, home: 'Сенегал', away: 'Ирак', date: '2026-06-23', time: '04:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { group: 'I', round: 3, home: 'Франция', away: 'Ирак', date: '2026-06-28', time: '04:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { group: 'I', round: 3, home: 'Норвегия', away: 'Сенегал', date: '2026-06-28', time: '04:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },

  // ========== ГРУППА J ==========
  { group: 'J', round: 1, home: 'Аргентина', away: 'Алжир', date: '2026-06-17', time: '04:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { group: 'J', round: 1, home: 'Австрия', away: 'Иордания', date: '2026-06-17', time: '07:00:00', stadium: 'Levi\'s Stadium', city: 'Санта-Клара', country: 'США' },
  { group: 'J', round: 2, home: 'Иордания', away: 'Аргентина', date: '2026-06-23', time: '22:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { group: 'J', round: 2, home: 'Алжир', away: 'Австрия', date: '2026-06-24', time: '01:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { group: 'J', round: 3, home: 'Аргентина', away: 'Австрия', date: '2026-06-29', time: '02:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { group: 'J', round: 3, home: 'Иордания', away: 'Алжир', date: '2026-06-29', time: '02:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },

  // ========== ГРУППА K ==========
  { group: 'K', round: 1, home: 'Португалия', away: 'ДР Конго', date: '2026-06-17', time: '23:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { group: 'K', round: 1, home: 'Узбекистан', away: 'Колумбия', date: '2026-06-18', time: '08:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { group: 'K', round: 2, home: 'Колумбия', away: 'Португалия', date: '2026-06-24', time: '04:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { group: 'K', round: 2, home: 'ДР Конго', away: 'Узбекистан', date: '2026-06-24', time: '07:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { group: 'K', round: 3, home: 'Португалия', away: 'Узбекистан', date: '2026-06-29', time: '04:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { group: 'K', round: 3, home: 'Колумбия', away: 'ДР Конго', date: '2026-06-29', time: '04:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },

  // ========== ГРУППА L ==========
  { group: 'L', round: 1, home: 'Англия', away: 'Хорватия', date: '2026-06-18', time: '02:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { group: 'L', round: 1, home: 'Гана', away: 'Панама', date: '2026-06-18', time: '05:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { group: 'L', round: 2, home: 'Панама', away: 'Англия', date: '2026-06-24', time: '22:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { group: 'L', round: 2, home: 'Хорватия', away: 'Гана', date: '2026-06-25', time: '01:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { group: 'L', round: 3, home: 'Англия', away: 'Гана', date: '2026-06-30', time: '02:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { group: 'L', round: 3, home: 'Панама', away: 'Хорватия', date: '2026-06-30', time: '02:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
 */];

// ========== ФУНКЦИЯ ПОЛУЧЕНИЯ КОДА КОМАНДЫ ==========
const getTeamCode = (teamName) => {
  return teamCodes[teamName] || teamName.slice(0, 3).toUpperCase();
};

// ========== ОСНОВНАЯ ФУНКЦИЯ ИМПОРТА ==========
async function importWorldCup() {
  console.log('🚀 Начинаем импорт ЧМ-2026...\n');

  // 1. Создаём турнир
  /*
  console.log('📌 Создаём турнир...');
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .upsert(tournamentData, { onConflict: 'year' })
    .select()
    .single();

  if (tournamentError) {
    console.error('❌ Ошибка создания турнира:', tournamentError);
    return;
  }
  console.log(`✅ Турнир: ${tournament.name} ${tournament.year} (ID: ${tournament.id})`);

  // 2. Создаём этапы
  console.log('\n📌 Создаём этапы...');
  for (const stage of stagesData) {
    const { error } = await supabase
      .from('stages')
      .upsert({ ...stage, tournament_id: tournament.id }, { onConflict: 'tournament_id, name' });
    
    if (error) {
      console.error(`❌ Ошибка этапа ${stage.name}:`, error);
    } else {
      console.log(`✅ Этап: ${stage.name}`);
    }
  }
*/
  // 3. Получаем ID группового этапа
  const { data: groupStage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('name', 'Групповой этап')
    .single();

  if (!groupStage) {
    console.error('❌ Групповой этап не найден');
    return;
  }

  // 4. Импортируем матчи
  console.log('\n📌 Импортируем матчи группового этапа...');
  let matchNumber = 1;
  let importedCount = 0;

  for (const match of groupMatches) {
    const deadline = new Date(`${match.date}T${match.time}`);
    deadline.setHours(deadline.getHours() - 1);
    
    const matchData = {
      tournament_id: 2,
      stage_id: groupStage.id,
      match_number: matchNumber++,
      round_number: match.round,
      home_team: match.home,
      away_team: match.away,
      home_team_code: getTeamCode(match.home),
      away_team_code: getTeamCode(match.away),
      match_date: match.date,
      match_time: match.time,
      stadium: match.stadium,
      city: match.city,
      country: match.country,
      round_deadline: deadline.toISOString(),
      is_finished: false,
    };

    const { error } = await supabase.from('matches').upsert(matchData, {
      onConflict: 'tournament_id, match_number',
    });

    if (error) {
      console.error(`❌ Ошибка: ${match.home} vs ${match.away}`, error.message);
    } else {
      console.log(`✅ ${match.group} | Тур ${match.round} | ${match.home} vs ${match.away} | ${match.city} | ${match.time} MSK`);
      importedCount++;
    }
  }

  console.log(`\n🎉 Импорт завершён!`);
  console.log(`📊 Добавлено матчей: ${importedCount}`);
  console.log(`🏟️ Все матчи с реальными стадионами и московским временем`);
}

// ЗАПУСК
importWorldCup().catch(console.error);