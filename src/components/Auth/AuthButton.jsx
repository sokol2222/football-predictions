// src/components/Auth/AuthButton.jsx
import { useState, createContext, useContext } from 'react';
import { Button, Avatar, Menu, MenuItem, Box, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthModal from './AuthModal';

// Создаём контекст для доступа к модалке из любого места
const AuthModalContext = createContext();

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState(0);

  const showAuthModal = (tab = 0) => {
    setDefaultTab(tab);
    setOpen(true);
  };

  return (
    <AuthModalContext.Provider value={{ showAuthModal }}>
      {children}
      <AuthModal open={open} onClose={() => setOpen(false)} defaultTab={defaultTab} />
    </AuthModalContext.Provider>
  );
};

const AuthButton = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const { showAuthModal } = useAuthModal();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleClose();
  };

  if (!user) {
    return (
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => showAuthModal(0)}
        sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300, borderRadius: 2 }}
      >
        Войти / Регистрация
      </Button>
    );
  }

  const initials = user.email?.charAt(0).toUpperCase() || '?';
  const userName = user.email?.split('@')[0] || 'Пользователь';

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
      <Button onClick={handleMenu} sx={{ textTransform: 'none', bgcolor: 'background.paper', borderRadius: 2 }}>
        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
          {initials}
        </Avatar>
        <Typography variant="body1" color="text.primary">
          {userName}
        </Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Мой профиль</MenuItem>
        <MenuItem onClick={handleClose}>Мои прогнозы</MenuItem>
        <MenuItem onClick={handleLogout}>Выйти</MenuItem>
      </Menu>
    </Box>
  );
};

export default AuthButton;