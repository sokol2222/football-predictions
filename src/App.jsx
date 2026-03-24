// App.jsx
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { AuthProvider } from './contexts/AuthContext'
import theme from './theme'
import MatchList from './components/MatchList'
import AuthButton from './components/Auth/AuthButton'
import { useState } from 'react'
import Layout from './components/Layout/Layout'
import MatchCalendar from './components/Calendar/MatchCalendar'
import MyPredictions from './components/Profile/MyPredictions'
import ParticipantsList from './components/Profile/ParticipantsList'
import Profile from './components/Profile/Profile'

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  console.log('App рендерится, текущая страница:', currentPage);

  const renderPage = () => {
    console.log('Рендерим страницу:', currentPage);
      switch(currentPage) {
        case 'home':
          return <MatchList />;
        case 'calendar':
          return <MatchCalendar />;
        case 'participants':
          return <ParticipantsList />;
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
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App