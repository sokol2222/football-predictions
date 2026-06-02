// src/utils/stageUtils.js

/**
 * Получение названия этапа по номеру тура
 * @param {number} roundNumber - номер тура
 * @returns {string} название этапа
 */
export const getStageLabel = (roundNumber) => {
  if (roundNumber >= 1 && roundNumber <= 3) return `${roundNumber} тур`;
  if (roundNumber === 4) return '1/16 финала';
  if (roundNumber === 5) return '1/8 финала';
  if (roundNumber === 6) return '1/4 финала';
  if (roundNumber === 7) return '1/2 финала';
  if (roundNumber === 8) return 'Финал';
  return `${roundNumber} тур`;
};

/**
 * Получение цвета для этапа
 * @param {number} roundNumber - номер тура
 * @returns {string} цвет для MUI Chip
 */
export const getStageColor = (roundNumber) => {
  if (roundNumber <= 3) return 'primary';
  if (roundNumber === 4) return 'secondary';
  if (roundNumber === 5) return 'secondary';
  if (roundNumber === 6) return 'secondary';
  if (roundNumber === 7) return 'secondary';
  if (roundNumber === 8) return 'warning';
  return 'default';
};

/**
 * Получение порядка сортировки для этапов
 * @param {number} roundNumber - номер тура
 * @returns {number} порядковый номер
 */
export const getStageOrder = (roundNumber) => {
  if (roundNumber <= 3) return 1;
  if (roundNumber === 4) return 2;
  if (roundNumber === 5) return 3;
  if (roundNumber === 6) return 4;
  if (roundNumber === 7) return 5;
  if (roundNumber === 8) return 6;
  return 1;
};