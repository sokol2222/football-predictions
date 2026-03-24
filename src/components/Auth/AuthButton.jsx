import { useState } from 'react';
import { Button, Avatar, Menu, MenuItem, Box, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthModal from './AuthModal';

const AuthButton = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleClose();
  };

  if (!user) {
    return (
      <>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setAuthModalOpen(true)}
          sx={{ position: 'absolute', top: 20, right: 20 }}
        >
          Войти / Регистрация
        </Button>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  const initials = user.email?.charAt(0).toUpperCase() || '?';
  const userName = user.email?.split('@')[0] || 'Пользователь';

  return (
    <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
      <Button onClick={handleMenu} sx={{ textTransform: 'none' }}>
        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
          {initials}
        </Avatar>
        <Typography variant="body1" color="text.primary">
          {userName}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>Мой профиль</MenuItem>
        <MenuItem onClick={handleClose}>Мои прогнозы</MenuItem>
        <MenuItem onClick={handleLogout}>Выйти</MenuItem>
      </Menu>
    </Box>
  );
};

export default AuthButton;