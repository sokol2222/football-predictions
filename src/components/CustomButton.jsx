import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const FootballButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: '10px 24px',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  color: 'white',
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .3)',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
  },
}));

export default FootballButton;