import { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Avatar, Typography, Divider, useTheme,
  AppBar, Toolbar, IconButton,
  styled
} from '@mui/material';

// Иконки
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const drawerWidth = 240;
const collapsedDrawerWidth = 65;

// Стили для открытого меню
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

// Стили для закрытого меню
const closedMixin = (theme) => ({
  width: collapsedDrawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
});

// Кастомный Drawer с анимацией
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const NavMenu = ({ currentPage, onPageChange, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'home', label: 'Главная', icon: <HomeIcon /> },
    { id: 'calendar', label: 'Календарь матчей', icon: <CalendarMonthIcon /> },
    { id: 'participants', label: 'Участники', icon: <PeopleIcon /> },
    { id: 'stats', label: 'Статистика', icon: <BarChartIcon /> },           // 👈 ДОБАВИТЬ
    { id: 'stats-adv', label: 'Статистика подробная', icon: <BarChartIcon /> },
    { id: 'stage-stats', label: 'Статистика по этапам', icon: <TimelineIcon /> },
    { id: 'my-predictions', label: 'Мои прогнозы', icon: <ScoreboardIcon /> },
    { id: 'profile', label: 'Профиль', icon: <PersonIcon /> },
  ];

  // Десктопное меню
  const desktopDrawer = (
    <StyledDrawer variant="permanent" open={desktopOpen}>
      <DrawerHeader>
        <IconButton onClick={handleDesktopToggle}>
          {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      
      {desktopOpen ? (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user?.email?.split('@')[0] || 'Гость'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user ? 'Онлайн' : 'Не авторизован'}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </Avatar>
        </Box>
      )}
      
      <Divider />
      
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
              sx={{
                minHeight: 48,
                justifyContent: desktopOpen ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  borderRight: desktopOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                  borderRadius: desktopOpen ? 0 : '4px',
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: desktopOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: currentPage === item.id ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {desktopOpen && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: desktopOpen ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: desktopOpen ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {desktopOpen && <ListItemText primary="Выйти" />}
          </ListItemButton>
        </ListItem>
      </List>
    </StyledDrawer>
  );

  // Мобильное меню
  const mobileDrawer = (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {user?.email?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.email?.split('@')[0] || 'Гость'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user ? 'Онлайн' : 'Не авторизован'}
          </Typography>
        </Box>
      </Box>
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => {
                onPageChange(item.id);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon sx={{ color: currentPage === item.id ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${desktopOpen ? drawerWidth : collapsedDrawerWidth}px)` },
          ml: { sm: `${desktopOpen ? drawerWidth : collapsedDrawerWidth}px` },
          display: { xs: 'block', sm: 'none' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Футбольные прогнозы
          </Typography>
        </Toolbar>
      </AppBar>

      {mobileDrawer}
      {desktopDrawer}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${desktopOpen ? drawerWidth : collapsedDrawerWidth}px)` },
          ml: { sm: `${desktopOpen ? drawerWidth : collapsedDrawerWidth}px` },
          mt: { xs: 8, sm: 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children} 
      </Box>
    </>
  );
};

export default NavMenu;