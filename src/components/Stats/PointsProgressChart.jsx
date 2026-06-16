// src/components/Stats/PointsProgressChart.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import {
  getMatches,
  getTournamentParticipants,
  getUserPredictionsForTournament,
  getPredictionsByFriendName
} from '../../services/api';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#FF8A80', '#80D8FF', '#FFD740', '#69F0AE', '#B388FF', '#FFAB91'
];

function PointsProgressChart({ tournamentId = 2 }) {
  const [chartData, setChartData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [showAll, setShowAll] = useState(true);

  const fetchProgressData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Получаем участников
      const { data: participantsData } = await getTournamentParticipants(tournamentId);
      const validParticipants = (participantsData || []).filter(p => p.display_name);
      setParticipants(validParticipants);

      // По умолчанию показываем всех
      const defaultActive = validParticipants.map(p => p.display_name);
      setActiveParticipants(defaultActive);

      // 2. Получаем завершённые матчи
      const { data: matches } = await getMatches(tournamentId);
      const finishedMatches = (matches || [])
        .filter(m => m.is_finished === true)
        .sort((a, b) => {
          const dateA = new Date(`${a.match_date}T${a.match_time || '00:00'}`);
          const dateB = new Date(`${b.match_date}T${b.match_time || '00:00'}`);
          return dateA - dateB;
        });

      if (finishedMatches.length === 0) {
        setChartData(null);
        setLoading(false);
        return;
      }

      // 3. Собираем данные для каждого участника
      const allPoints = {};

      for (const participant of validParticipants) {
        const displayName = participant.display_name;
        let predictions = [];

        if (participant.user_id) {
          const { data: preds } = await getUserPredictionsForTournament(
            participant.user_id,
            tournamentId
          );
          predictions = preds || [];
        } else if (displayName) {
          const { data: preds } = await getPredictionsByFriendName(displayName, tournamentId);
          predictions = preds || [];
        }

        // Создаём карту прогнозов
        const predictionsMap = {};
        predictions.forEach(p => {
          predictionsMap[p.match_id] = p;
        });

        allPoints[displayName] = finishedMatches.map(match => ({
          points_earned: predictionsMap[match.id]?.points_earned || 0,
          match_id: match.id,
          match_number: match.match_number,
          home_team: match.home_team,
          away_team: match.away_team,
          match_date: match.match_date,
        }));
      }

      // 4. Формируем данные для графика
      const labels = finishedMatches.map(
        (m, idx) => `Матч ${m.match_number || idx + 1}`
      );

      const cumulativePoints = {};
      const participantNames = Object.keys(allPoints);

      participantNames.forEach(name => {
        cumulativePoints[name] = [];
        let cumulative = 0;
        for (let i = 0; i < finishedMatches.length; i++) {
          cumulative += allPoints[name]?.[i]?.points_earned || 0;
          cumulativePoints[name].push(cumulative);
        }
      });

      setChartData({
        labels,
        finishedMatches,
        allPoints,
        cumulativePoints,
        participantNames,
      });

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [tournamentId]);

  // Переключатель участника
  const toggleParticipant = (name) => {
    setActiveParticipants(prev => {
      const newActive = prev.includes(name)
        ? prev.filter(f => f !== name)
        : [...prev, name];
      
      // Если все активны, устанавливаем флаг showAll
      const allNames = participants.map(p => p.display_name);
      setShowAll(newActive.length === allNames.length);
      
      return newActive;
    });
  };

  // Выбрать всех
  const selectAll = () => {
    const allNames = participants.map(p => p.display_name);
    setActiveParticipants(allNames);
    setShowAll(true);
  };

  // Сбросить выбор
  const clearAll = () => {
    setActiveParticipants([]);
    setShowAll(false);
  };

  // Обновить данные
  const refreshData = () => {
    fetchProgressData();
  };

  // Экспорт в PNG (через canvas)
  const exportChart = () => {
    const canvas = document.getElementById('progress-chart');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'points-progress.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  // Подготовка данных для Chart.js
  const chartJsData = useMemo(() => {
    if (!chartData) return null;

    const activeNames = participants
      .filter(p => activeParticipants.includes(p.display_name))
      .map(p => p.display_name);

    const datasets = activeNames.map((name, index) => {
      const data = chartData.cumulativePoints[name] || [];
      const color = COLORS[index % COLORS.length];
      
      return {
        label: name,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        tension: 0.3,
        fill: false,
      };
    });

    return {
      labels: chartData.labels,
      datasets,
    };
  }, [chartData, participants, activeParticipants]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' },
        },
        onClick: (e, legendItem) => {
          toggleParticipant(legendItem.text);
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 14,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} очков`;
          },
          afterBody: (tooltipItems) => {
            if (tooltipItems.length > 0) {
              const idx = tooltipItems[0].dataIndex;
              const match = chartData?.finishedMatches?.[idx];
              if (match) {
                const date = new Date(match.match_date).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                return [
                  `📅 ${date}`,
                  `🏆 ${match.home_team} — ${match.away_team}`
                ];
              }
            }
            return [];
          }
        }
      },
      title: {
        display: true,
        text: 'Динамика накопленных очков',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 20 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Накопленные очки',
          font: { size: 14, weight: 'bold' },
        },
        grid: {
          color: 'rgba(0,0,0,0.06)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Матчи (в хронологическом порядке)',
          font: { size: 14, weight: 'bold' },
          padding: { top: 10 }
        },
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          font: { size: 10 },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Состояние загрузки
  if (loading) {
    return (
      <Card elevation={3}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка данных...</Typography>
        </CardContent>
      </Card>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Alert
            severity="error"
            action={
              <IconButton color="inherit" size="small" onClick={refreshData}>
                <RefreshIcon />
              </IconButton>
            }
          >
            Ошибка загрузки: {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Нет данных
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <Card elevation={3}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            📊 Нет завершённых матчей для построения графика
          </Typography>
          <Typography variant="body2" color="textSecondary">
            График появится после завершения первых матчей
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Нет активных участников
  if (chartJsData?.datasets?.length === 0) {
    return (
      <Card elevation={3}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            👥 Выберите участников для отображения
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            <Chip label="Выбрать всех" onClick={selectAll} color="primary" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Основной рендер
  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>📈</span>
            <Typography variant="h6">Динамика очков прогнозистов</Typography>
          </Stack>
        }
        subheader={`${participants.length} участников | ${chartData.labels.length} матчей завершено`}
        action={
          <Stack direction="row" spacing={1}>
            <MuiTooltip title="Обновить">
              <IconButton onClick={refreshData} size="small">
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
            <MuiTooltip title="Скачать PNG">
              <IconButton onClick={exportChart} size="small">
                <DownloadIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>
        }
      />
      <CardContent>
        {/* Переключатели участников */}
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          mb={3}
          justifyContent="center"
          alignItems="center"
        >
          {participants.map((p, idx) => (
            <Chip
              key={p.id || p.display_name}
              label={p.display_name}
              onClick={() => toggleParticipant(p.display_name)}
              color={activeParticipants.includes(p.display_name) ? 'primary' : 'default'}
              variant={activeParticipants.includes(p.display_name) ? 'filled' : 'outlined'}
              size="small"
              sx={{
                backgroundColor: activeParticipants.includes(p.display_name)
                  ? COLORS[idx % COLORS.length]
                  : 'transparent',
                color: activeParticipants.includes(p.display_name) ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: activeParticipants.includes(p.display_name)
                    ? COLORS[idx % COLORS.length]
                    : 'rgba(0,0,0,0.05)',
                },
              }}
            />
          ))}
          
          <Chip
            label="Все"
            onClick={selectAll}
            color="info"
            variant={showAll ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Сбросить"
            onClick={clearAll}
            variant="outlined"
            size="small"
          />
        </Stack>

        {/* График */}
        <Box sx={{ height: 450, width: '100%' }}>
          <Line
            id="progress-chart"
            data={chartJsData || { labels: [], datasets: [] }}
            options={chartOptions}
          />
        </Box>

        <Typography variant="caption" color="textSecondary" display="block" align="center" sx={{ mt: 2 }}>
          💡 Нажмите на имя участника в легенде или на кнопку выше, чтобы скрыть/показать его линию
        </Typography>
      </CardContent>
    </Card>
  );
}

export default PointsProgressChart;