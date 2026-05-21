import { Modal, Box, Tab, Tabs, TextField, Button, Alert, Typography } from '@mui/material';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyInviteCode } from '../../services/api_invite_codes';

const AuthModal = ({ open, onClose, defaultTab = 0 }) => {
  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setInviteCode('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (tab === 0) {
        // Вход
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        handleClose();
      } else {
        // Регистрация
        if (!inviteCode) {
          setError('Введите код приглашения');
          setLoading(false);
          return;
        }
        
        const { valid, message } = await verifyInviteCode(inviteCode);
        if (!valid) {
          setError(message);
          setLoading(false);
          return;
        }
        
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { invited_by: inviteCode.toUpperCase() }
          }
        });
        if (signUpError) throw signUpError;
        
        setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 3,
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
          {tab === 0 ? '🔐 Вход' : '📝 Регистрация'}
        </Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Поле для кода — только при регистрации */}
        {tab === 1 && (
          <TextField
            fullWidth
            label="Код приглашения"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            helperText="Введите код, который дал вам администратор"
            sx={{ mb: 3 }}
          />
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleAuth}
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {loading ? 'Загрузка...' : (tab === 0 ? 'Войти' : 'Зарегистрироваться')}
        </Button>

        {tab === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Нет аккаунта? <Button variant="text" size="small" onClick={() => setTab(1)}>Зарегистрируйтесь</Button>
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default AuthModal;