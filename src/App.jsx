// App.jsx
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { AuthProvider } from './contexts/AuthContext'
import theme from './theme'
import MatchList from './components/MatchList'
import AuthButton, { AuthModalProvider } from './components/Auth/AuthButton'
import { useState } from 'react'
import Layout from './components/Layout/Layout'
import MatchCalendar from './components/Calendar/MatchCalendar'
import MyPredictions from './components/Profile/MyPredictions'
import ParticipantsList from './components/Profile/ParticipantsList'
import Profile from './components/Profile/Profile'
import TournamentStats from './components/Stats/TournamentStats'
import MatchStats from './components/Stats/MatchStats'
import StageStats from './components/Stats/StageStats'
import MaintenancePage from './components/Info/MaintenancePage'

function App() {

  const IS_MAINTENANCE_MODE = false; // true - показываем техработы, false - обычный режим

  if (IS_MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  const [currentPage, setCurrentPage] = useState('home');

  console.log('App рендерится, текущая страница:', currentPage);

  const renderPage = () => {
    console.log('Рендерим страницу:', currentPage);
      switch(currentPage) {
        case 'home':
          return <MatchList onNavigate={setCurrentPage}/>;
        case 'calendar':
          return <MatchCalendar />;
        case 'participants':
          return <ParticipantsList />;
        case 'stats':
          return <TournamentStats />;  
        case 'stats-adv':
          return <MatchStats />;
        case 'stage-stats':
          return <StageStats />;  
        case 'my-predictions':
          return <MyPredictions />;
        case 'profile':
          return <Profile />;
        default:
          return <MatchList />;
      }
    };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthModalProvider>
        <AuthButton onNavigate={setCurrentPage}/>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </Layout>
        {/*<Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h1" align="center" gutterBottom>
              ⚽ Прогнозы на футбол
            </Typography>
            <AuthButton />
            <MatchList />
          </Paper>
        </Container>*/}
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App