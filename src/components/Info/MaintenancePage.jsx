import { Box, Typography, Paper, Button, keyframes } from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

// Анимация для мяча
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const MaintenancePage = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a472a 0%, #0d2818 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Фоновые линии (как на футбольном поле) */}
      <Box sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 2%, transparent 2%)',
        backgroundSize: '40px 40px',
      }} />
      
      {/* Главная карточка */}
      <Paper sx={{
        p: 5,
        textAlign: 'center',
        borderRadius: 4,
        maxWidth: 500,
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Анимированный футбольный мяч */}
        <Box sx={{ 
          animation: `${bounce} 1s ease-in-out infinite`,
          display: 'inline-block',
          mb: 2,
        }}>
          <SportsSoccerIcon sx={{ fontSize: 80, color: '#2e7d32' }} />
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#1a472a' }}>
          ⚽ Технический перерыв
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Наше поле готовится к матчу.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Идёт замена газона и настройка ворот.
          Зайдите чуть позже — будет интересно!
        </Typography>
        
        {/* Таймер обратного отсчёта */}
        <Box sx={{ 
          bgcolor: '#1a472a', 
          borderRadius: 2, 
          p: 2, 
          mb: 3,
          color: 'white',
        }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            ОРИЕНТИРОВОЧНОЕ ВРЕМЯ ВОЗВРАЩЕНИЯ
          </Typography>
          <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            21:00 🕐
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{
            bgcolor: '#2e7d32',
            '&:hover': { bgcolor: '#1b5e20' },
            px: 4,
            borderRadius: 3,
          }}
        >
          Обновить поле
        </Button>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          😄 Следите за новостями в чате
        </Typography>
      </Paper>
      
      {/* Угловые флажки */}
      <Box sx={{ position: 'absolute', bottom: 20, left: 20 }}>
        <Typography variant="h2">🚩</Typography>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Typography variant="h2">🚩</Typography>
      </Box>
    </Box>
  );
};

export default MaintenancePage;