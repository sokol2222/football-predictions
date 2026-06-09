// src/components/UI/TournamentInfo.jsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ExactIcon,
  TrendingUp as ResultIcon,
  Difference as DiffIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const TournamentInfo = ({ open, onClose }) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <TrophyIcon color="primary" />
        Турнир прогнозистов ЧМ 2026
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Даты */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="info" /> Даты турнира
          </Typography>
          <Typography variant="body2">
            <strong>Групповой этап:</strong> 11.06.2026 22:00 — 28.06.2026 05:00
          </Typography>
          <Typography variant="body2">
            <strong>Плей-офф:</strong> 28.06.2026 22:00 — 19.07.2026 22:00
          </Typography>
        </Paper>

        {/* Правила подсчёта баллов */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2 }}>
          📋 Правила подсчёта баллов
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Chip label="3 балла" size="medium" color="success" sx={{ minWidth: 80, fontWeight: 700 }} />
            <Typography variant="body2">Правильно угаданный результат матча (точный счёт)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Chip label="2 балла" size="medium" color="warning" sx={{ minWidth: 80, fontWeight: 700 }} />
            <Typography variant="body2">Правильно угаданная разница</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Chip label="1 балл" size="medium" color="info" sx={{ minWidth: 80, fontWeight: 700 }} />
            <Typography variant="body2">Правильно угаданный исход</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Chip label="0 баллов" size="medium" color="default" sx={{ minWidth: 80, fontWeight: 700 }} />
            <Typography variant="body2">Неугаданный исход</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Призовой фонд */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon color="warning" /> Призовой фонд (2000 ₽)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Призовой фонд формируется по желанию участников. Можно сдать деньги только на групповой этап, только на плей-офф или на весь турнир.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Распределение:</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><Typography sx={{ fontWeight: 700 }}>60%</Typography></ListItemIcon>
                <ListItemText primary="1 место" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Typography sx={{ fontWeight: 700 }}>25%</Typography></ListItemIcon>
                <ListItemText primary="2 место" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Typography sx={{ fontWeight: 700 }}>15%</Typography></ListItemIcon>
                <ListItemText primary="3 место" />
              </ListItem>
            </List>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Деньги на групповой этап принимаются до 11 июня 15:00, деньги на плей-офф до 28 июня 18:00
            </Typography>
          </AccordionDetails>
        </Accordion>

       
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TournamentInfo;