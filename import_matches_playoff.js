export const playoffMatches = [
  // ============================================================
  // 1/16 ФИНАЛА (16 матчей)
  // ============================================================
  // A03 — 28.06.2026 22:00
    // ============================================================
    /*
  { match_number: 73, stage: '1/16 финала', round: 4, home_team: 'ЮАР', away_team: 'Канада', date: '2026-06-28', time: '22:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { match_number: 74, stage: '1/16 финала', round: 4, home_team: 'Бразилия', away_team: '2F', date: '2026-06-29', time: '20:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 75, stage: '1/16 финала', round: 4, home_team: 'Германия', away_team: '3ABCDF', date: '2026-06-29', time: '23:30:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 76, stage: '1/16 финала', round: 4, home_team: '1F', away_team: 'Марокко', date: '2026-06-30', time: '04:00:00', stadium: 'SoFi Stadium', city: 'Лос-Анджелес', country: 'США' },
  { match_number: 77, stage: '1/16 финала', round: 4, home_team: '2E', away_team: '2I', date: '2026-06-30', time: '20:00:00', stadium: 'Lincoln Financial Field', city: 'Филадельфия', country: 'США' },
  { match_number: 78, stage: '1/16 финала', round: 4, home_team: '1I', away_team: '3CDFGH', date: '2026-07-01', time: '00:00:00', stadium: 'Hard Rock Stadium', city: 'Майами-Гарденс', country: 'США' },
  { match_number: 79, stage: '1/16 финала', round: 4, home_team: 'Мексика', away_team: '3CEFHI', date: '2026-07-01', time: '04:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 80, stage: '1/16 финала', round: 4, home_team: '1L', away_team: '3EHIJK', date: '2026-07-01', time: '19:00:00', stadium: 'Arrowhead Stadium', city: 'Канзас-Сити', country: 'США' },
  { match_number: 81, stage: '1/16 финала', round: 4, home_team: '1G', away_team: '3AEHIJ', date: '2026-07-01', time: '23:00:00', stadium: 'BC Place', city: 'Ванкувер', country: 'Канада' },
  { match_number: 82, stage: '1/16 финала', round: 4, home_team: 'США', away_team: '3BEFIJ', date: '2026-07-02', time: '03:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { match_number: 83, stage: '1/16 финала', round: 4, home_team: '1H', away_team: '2J', date: '2026-07-02', time: '22:00:00', stadium: 'NRG Stadium', city: 'Хьюстон', country: 'США' },
  { match_number: 84, stage: '1/16 финала', round: 4, home_team: '2K', away_team: '2L', date: '2026-07-03', time: '02:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { match_number: 85, stage: '1/16 финала', round: 4, home_team: 'Швейцария', away_team: '3EFGIJ', date: '2026-07-03', time: '06:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },
  { match_number: 86, stage: '1/16 финала', round: 4, home_team: '2D', away_team: '2G', date: '2026-07-03', time: '21:00:00', stadium: "Levi's Stadium", city: 'Санта-Клара', country: 'США' },
  { match_number: 87, stage: '1/16 финала', round: 4, home_team: 'Аргентина', away_team: '2H', date: '2026-07-04', time: '01:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 88, stage: '1/16 финала', round: 4, home_team: '1K', away_team: '3DEIJL', date: '2026-07-04', time: '04:30:00', stadium: 'Estadio BBVA', city: 'Гваделупа', country: 'Мексика' },

  // ============================================================
  // 1/8 ФИНАЛА — с parent_match_number
  // ============================================================
  { match_number: 89, stage: '1/8 финала', round: 5, home_parent_match: 73, away_parent_match: 76, date: '2026-07-04', time: '20:00:00', stadium: 'Estadio Azteca', city: 'Мехико', country: 'Мексика' },
  { match_number: 90, stage: '1/8 финала', round: 5, home_parent_match: 75, away_parent_match: 78, date: '2026-07-05', time: '00:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 91, stage: '1/8 финала', round: 5, home_parent_match: 74, away_parent_match: 77, date: '2026-07-05', time: '23:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 92, stage: '1/8 финала', round: 5, home_parent_match: 79, away_parent_match: 80, date: '2026-07-06', time: '03:00:00', stadium: 'Mercedes-Benz Stadium', city: 'Атланта', country: 'США' },
  { match_number: 93, stage: '1/8 финала', round: 5, home_parent_match: 84, away_parent_match: 83, date: '2026-07-06', time: '22:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { match_number: 94, stage: '1/8 финала', round: 5, home_parent_match: 82, away_parent_match: 81, date: '2026-07-07', time: '03:00:00', stadium: 'Lumen Field', city: 'Сиэтл', country: 'США' },
  { match_number: 95, stage: '1/8 финала', round: 5, home_parent_match: 87, away_parent_match: 86, date: '2026-07-07', time: '19:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },
  { match_number: 96, stage: '1/8 финала', round: 5, home_parent_match: 85, away_parent_match: 88, date: '2026-07-07', time: '23:00:00', stadium: 'BMO Field', city: 'Торонто', country: 'Канада' },

  // ============================================================
  // 1/4 ФИНАЛА — с parent_match_number
  // ============================================================
  { match_number: 97, stage: 'Четвертьфинал', round: 6, home_parent_match: 90, away_parent_match: 89, date: '2026-07-09', time: '23:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 98, stage: 'Четвертьфинал', round: 6, home_parent_match: 93, away_parent_match: 94, date: '2026-07-10', time: '22:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
  { match_number: 99, stage: 'Четвертьфинал', round: 6, home_parent_match: 91, away_parent_match: 92, date: '2026-07-12', time: '00:00:00', stadium: 'Gillette Stadium', city: 'Фоксборо', country: 'США' },
  { match_number: 100, stage: 'Четвертьфинал', round: 6, home_parent_match: 95, away_parent_match: 96, date: '2026-07-12', time: '04:00:00', stadium: 'Estadio Akron', city: 'Сапопан', country: 'Мексика' },

  // ============================================================
  // 1/2 ФИНАЛА — с parent_match_number
  // ============================================================
  { match_number: 101, stage: 'Полуфинал', round: 7, home_parent_match: 97, away_parent_match: 98, date: '2026-07-14', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
  { match_number: 102, stage: 'Полуфинал', round: 7, home_parent_match: 99, away_parent_match: 100, date: '2026-07-15', time: '22:00:00', stadium: 'AT&T Stadium', city: 'Арлингтон', country: 'США' },
*/
  // ============================================================
  // МАТЧ ЗА 3-Е МЕСТО — без родительских матчей (явные команды)
  // ============================================================
  { match_number: 103, stage: 'Матч за 3-е место', round: 8, home_parent_match: '101', away_parent_match: '102', date: '2026-07-19', time: '00:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },

  // ============================================================
  // ФИНАЛ — с parent_match_number
  // ============================================================
 // { match_number: 104, stage: 'Финал', round: 8, home_parent_match: 101, away_parent_match: 102, date: '2026-07-19', time: '22:00:00', stadium: 'MetLife Stadium', city: 'Ист-Резерфорд', country: 'США' },
];