import { useState } from 'react';
import { 
  Paper, TextField, Button, Box, Typography, 
  InputAdornment, useTheme 
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

const PredictionForm = ({ match, onPredict }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const theme = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict({
      matchId: match.id,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore)
    });
    setHomeScore('');
    setAwayScore('');
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mt: 2, 
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SportsSoccerIcon color="secondary" />
        Твой прогноз: {match.home} - {match.away}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="number"
            label={`${match.home}`}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            InputProps={{
              inputProps: { min: 0, max: 20 },
              startAdornment: <InputAdornment position="start">⚽</InputAdornment>
            }}
            required
            fullWidth
          />
          <Typography variant="h5">:</Typography>
          <TextField
            type="number"
            label={`${match.away}`}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            InputProps={{
              inputProps: { min: 0, max: 20 },
              startAdornment: <InputAdornment position="start">⚽</InputAdornment>
            }}
            required
            fullWidth
          />
        </Box>
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          size="large"
          startIcon={<SportsSoccerIcon />}
        >
          Сделать прогноз
        </Button>
      </Box>
    </Paper>
  );
};

export default PredictionForm;