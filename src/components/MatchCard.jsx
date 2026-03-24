import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StadiumIcon from '@mui/icons-material/Stadium';

const MatchCard = ({ match }) => {
  return (
    <Card sx={{ 
      minWidth: 275, 
      mb: 2,
      transition: '0.3s',
      '&:hover': { 
        transform: 'translateY(-4px)', 
        boxShadow: (theme) => theme.shadows[6] 
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {match.home}
          </Typography>
          <SportsSoccerIcon color="primary" sx={{ mx: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {match.away}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<CalendarTodayIcon />} 
            label={match.date}
            size="small"
            variant="outlined"
          />
          <Chip 
            icon={<AccessTimeIcon />} 
            label={match.time}
            size="small"
            variant="outlined"
          />
          {match.stadium && (
            <Chip 
              icon={<StadiumIcon />} 
              label={match.stadium}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MatchCard;