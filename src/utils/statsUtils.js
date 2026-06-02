// Расчёт суммарной статистики участника по всем матчам
export const calculateParticipantStats = (userId, matches, allPredictions) => {
  let exactScores = 0;      // Точные счета (3 очка)
  let exactDiffs = 0;       // Угаданная разница (2 очка)
  let correctResults = 0;   // Угаданный исход (1 очко)
  let totalPoints = 0;
  let totalPredictions = 0;
  
  for (const match of matches) {
    if (match.is_finished && match.actual_home_score !== null) {
      const prediction = allPredictions[userId]?.[match.id];
      if (prediction) {
        totalPredictions++;
        const actualResult = {
          home: match.actual_home_score,
          away: match.actual_away_score,
        };
        const pointsData = calculatePoints(
          { homeScore: prediction.home_score, awayScore: prediction.away_score },
          actualResult
        );
        
        totalPoints += pointsData.points;
        if (pointsData.isExact) exactScores++;
        if (pointsData.isExactDiff) exactDiffs++;
        if (pointsData.isCorrectResult) correctResults++;
      }
    }
  }
  
  return {
    exactScores,
    exactDiffs,
    correctResults,
    totalPoints,
    totalPredictions,
  };
};