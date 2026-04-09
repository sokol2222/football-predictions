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
  // 11 июня 2026
  { match_number: 1, group: 'A', round: 1, home: 'Мексика', away: 'ЮАР', date: '2026-06-11', time: '22:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  
  // 12 июня 2026
  { match_number: 2, group: 'A', round: 1, home: 'Южная Корея', away: 'Чехия', date: '2026-06-12', time: '05:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 3, group: 'B', round: 1, home: 'Канада', away: 'Босния и Герцеговина', date: '2026-06-12', time: '22:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  
  // 13 июня 2026
  { match_number: 4, group: 'D', round: 1, home: 'США', away: 'Парагвай', date: '2026-06-13', time: '04:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { match_number: 5, group: 'B', round: 1, home: 'Катар', away: 'Швейцария', date: '2026-06-13', time: '22:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  
  // 14 июня 2026
  { match_number: 6, group: 'C', round: 1, home: 'Бразилия', away: 'Марокко', date: '2026-06-14', time: '01:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 7, group: 'C', round: 1, home: 'Гаити', away: 'Шотландия', date: '2026-06-14', time: '04:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 8, group: 'D', round: 1, home: 'Австралия', away: 'Турция', date: '2026-06-14', time: '07:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 9, group: 'E', round: 1, home: 'Германия', away: 'Кюрасао', date: '2026-06-14', time: '20:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 10, group: 'F', round: 1, home: 'Нидерланды', away: 'Япония', date: '2026-06-14', time: '23:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  /*
  // 15 июня 2026
  { match_number: 11, group: 'E', round: 1, home: 'Кот-д\'Ивуар', away: 'Эквадор', date: '2026-06-15', time: '02:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { match_number: 12, group: 'F', round: 1, home: 'Швеция', away: 'Тунис', date: '2026-06-15', time: '05:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  { match_number: 13, group: 'H', round: 1, home: 'Испания', away: 'Кабо-Верде', date: '2026-06-15', time: '19:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 14, group: 'G', round: 1, home: 'Бельгия', away: 'Египет', date: '2026-06-15', time: '22:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  
  // 16 июня 2026
  { match_number: 15, group: 'H', round: 1, home: 'Саудовская Аравия', away: 'Уругвай', date: '2026-06-16', time: '01:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { match_number: 16, group: 'G', round: 1, home: 'Иран', away: 'Новая Зеландия', date: '2026-06-16', time: '04:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { match_number: 17, group: 'I', round: 1, home: 'Франция', away: 'Сенегал', date: '2026-06-16', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  
  // 17 июня 2026
  { match_number: 18, group: 'I', round: 1, home: 'Ирак', away: 'Норвегия', date: '2026-06-17', time: '01:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 19, group: 'J', round: 1, home: 'Аргентина', away: 'Алжир', date: '2026-06-17', time: '04:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { match_number: 20, group: 'J', round: 1, home: 'Австрия', away: 'Иордания', date: '2026-06-17', time: '07:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  { match_number: 21, group: 'K', round: 1, home: 'Португалия', away: 'ДР Конго', date: '2026-06-17', time: '20:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 22, group: 'L', round: 1, home: 'Англия', away: 'Хорватия', date: '2026-06-17', time: '23:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  
  // 18 июня 2026
  { match_number: 23, group: 'L', round: 1, home: 'Гана', away: 'Панама', date: '2026-06-18', time: '02:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { match_number: 24, group: 'K', round: 1, home: 'Узбекистан', away: 'Колумбия', date: '2026-06-18', time: '05:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { match_number: 25, group: 'A', round: 2, home: 'Чехия', away: 'ЮАР', date: '2026-06-18', time: '19:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 26, group: 'B', round: 2, home: 'Швейцария', away: 'Босния и Герцеговина', date: '2026-06-18', time: '22:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  */
  // 19 июня 2026
  { match_number: 27, group: 'B', round: 2, home: 'Канада', away: 'Катар', date: '2026-06-19', time: '01:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 28, group: 'A', round: 2, home: 'Мексика', away: 'Южная Корея', date: '2026-06-19', time: '04:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 29, group: 'D', round: 2, home: 'США', away: 'Австралия', date: '2026-06-19', time: '22:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  /*
  // 20 июня 2026
  { match_number: 30, group: 'C', round: 2, home: 'Шотландия', away: 'Марокко', date: '2026-06-20', time: '01:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 31, group: 'C', round: 2, home: 'Бразилия', away: 'Гаити', date: '2026-06-20', time: '04:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { match_number: 32, group: 'D', round: 2, home: 'Турция', away: 'Парагвай', date: '2026-06-20', time: '07:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  { match_number: 33, group: 'F', round: 2, home: 'Нидерланды', away: 'Швеция', date: '2026-06-20', time: '20:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 34, group: 'E', round: 2, home: 'Германия', away: 'Кот-д\'Ивуар', date: '2026-06-20', time: '23:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  
  // 21 июня 2026
  { match_number: 35, group: 'E', round: 2, home: 'Эквадор', away: 'Кюрасао', date: '2026-06-21', time: '03:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { match_number: 36, group: 'F', round: 2, home: 'Тунис', away: 'Япония', date: '2026-06-21', time: '07:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  { match_number: 37, group: 'H', round: 2, home: 'Испания', away: 'Саудовская Аравия', date: '2026-06-21', time: '19:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 38, group: 'G', round: 2, home: 'Бельгия', away: 'Иран', date: '2026-06-21', time: '22:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  
  // 22 июня 2026
  { match_number: 39, group: 'H', round: 2, home: 'Уругвай', away: 'Кабо-Верде', date: '2026-06-22', time: '01:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { match_number: 40, group: 'G', round: 2, home: 'Новая Зеландия', away: 'Египет', date: '2026-06-22', time: '04:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 41, group: 'J', round: 2, home: 'Аргентина', away: 'Австрия', date: '2026-06-22', time: '20:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  
  // 23 июня 2026
  { match_number: 42, group: 'I', round: 2, home: 'Франция', away: 'Ирак', date: '2026-06-23', time: '00:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { match_number: 43, group: 'I', round: 2, home: 'Норвегия', away: 'Сенегал', date: '2026-06-23', time: '03:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { match_number: 44, group: 'J', round: 2, home: 'Иордания', away: 'Алжир', date: '2026-06-23', time: '06:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  { match_number: 45, group: 'K', round: 2, home: 'Португалия', away: 'Узбекистан', date: '2026-06-23', time: '20:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 46, group: 'L', round: 2, home: 'Англия', away: 'Гана', date: '2026-06-23', time: '23:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  
  // 24 июня 2026
  { match_number: 47, group: 'L', round: 2, home: 'Панама', away: 'Хорватия', date: '2026-06-24', time: '02:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { match_number: 48, group: 'K', round: 2, home: 'Колумбия', away: 'ДР Конго', date: '2026-06-24', time: '05:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 49, group: 'B', round: 3, home: 'Канада', away: 'Швейцария', date: '2026-06-24', time: '22:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 50, group: 'B', round: 3, home: 'Босния и Герцеговина', away: 'Катар', date: '2026-06-24', time: '22:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  
  // 25 июня 2026
  { match_number: 51, group: 'C', round: 3, home: 'Марокко', away: 'Гаити', date: '2026-06-25', time: '01:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 52, group: 'C', round: 3, home: 'Шотландия', away: 'Бразилия', date: '2026-06-25', time: '01:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { match_number: 53, group: 'A', round: 3, home: 'Мексика', away: 'Чехия', date: '2026-06-25', time: '04:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { match_number: 54, group: 'A', round: 3, home: 'ЮАР', away: 'Южная Корея', date: '2026-06-25', time: '04:00:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },
  { match_number: 55, group: 'E', round: 3, home: 'Эквадор', away: 'Германия', date: '2026-06-25', time: '23:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 56, group: 'E', round: 3, home: 'Кюрасао', away: 'Кот-д\'Ивуар', date: '2026-06-25', time: '23:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  
  // 26 июня 2026
  { match_number: 57, group: 'F', round: 3, home: 'Тунис', away: 'Нидерланды', date: '2026-06-26', time: '02:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { match_number: 58, group: 'F', round: 3, home: 'Япония', away: 'Швеция', date: '2026-06-26', time: '02:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { match_number: 59, group: 'D', round: 3, home: 'США', away: 'Турция', date: '2026-06-26', time: '05:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { match_number: 60, group: 'D', round: 3, home: 'Парагвай', away: 'Австралия', date: '2026-06-26', time: '05:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  { match_number: 61, group: 'I', round: 3, home: 'Норвегия', away: 'Франция', date: '2026-06-26', time: '22:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 62, group: 'I', round: 3, home: 'Сенегал', away: 'Ирак', date: '2026-06-26', time: '22:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  
  // 27 июня 2026
  { match_number: 63, group: 'H', round: 3, home: 'Уругвай', away: 'Испания', date: '2026-06-27', time: '03:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 64, group: 'H', round: 3, home: 'Кабо-Верде', away: 'Саудовская Аравия', date: '2026-06-27', time: '03:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 65, group: 'J', round: 3, home: 'Иордания', away: 'Аргентина', date: '2026-06-27', time: '22:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { match_number: 66, group: 'J', round: 3, home: 'Алжир', away: 'Австрия', date: '2026-06-27', time: '22:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  
  // 28 июня 2026
  { match_number: 67, group: 'K', round: 3, home: 'Колумбия', away: 'Португалия', date: '2026-06-28', time: '00:30:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { match_number: 68, group: 'K', round: 3, home: 'ДР Конго', away: 'Узбекистан', date: '2026-06-28', time: '00:30:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 69, group: 'L', round: 3, home: 'Панама', away: 'Англия', date: '2026-06-28', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 70, group: 'L', round: 3, home: 'Хорватия', away: 'Гана', date: '2026-06-28', time: '22:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  
  // 29 июня 2026
  { match_number: 71, group: 'G', round: 3, home: 'Новая Зеландия', away: 'Бельгия', date: '2026-06-29', time: '04:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 72, group: 'G', round: 3, home: 'Египет', away: 'Иран', date: '2026-06-29', time: '04:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  */
];

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
    .eq('tournament_id', 2)
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
      match_number: match.match_number,
      group: match.group,
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

    //console.log('matchData', matchData)

    /*const { error } = await supabase.from('matches').upsert(matchData, {
      onConflict: 'tournament_id, match_number',
    });*/

    const { error } = await supabase.from('matches').insert(matchData);

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