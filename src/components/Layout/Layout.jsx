import { Box } from '@mui/material';
import NavMenu from './NavMenu';

const drawerWidth = 240;

const Layout = ({ currentPage, onPageChange, children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <NavMenu currentPage={currentPage} onPageChange={onPageChange} children={children} />
      
      {/* Основной контент
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, sm: 0 }, // Отступ для мобильной шапки
        }}
      >
        {children}
      </Box> */}
    </Box>
  );
}

export default Layout;