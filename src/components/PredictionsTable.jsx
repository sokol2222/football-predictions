import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, Chip 
} from '@mui/material';

const PredictionsTable = ({ predictions, matchName }) => {
  if (!predictions || predictions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
        📭 Пока нет прогнозов на этот матч
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ p: 2, pb: 0, color: 'primary.main' }}>
        Прогнозы на матч {matchName}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell><b>Друг</b></TableCell>
            <TableCell align="center"><b>Прогноз</b></TableCell>
            <TableCell><b>Когда</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {predictions.map((pred) => (
            <TableRow key={pred.id} hover>
              <TableCell>
                <Chip 
                  label={pred.friend_name} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 'bold' }}>
                  {pred.home_score} : {pred.away_score}
                </Typography>
              </TableCell>
              <TableCell>
                {new Date(pred.created_at).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PredictionsTable;