# ⚽ Футбольные прогнозы

Приложение для прогнозов на футбольные матчи с друзьями.

## 🚀 Возможности

- 📅 Календарь матчей с редактированием счёта
- 👥 Система авторизации через Supabase
- 🌙 Тёмная/светлая тема
- 💾 Сохранение прогнозов в облаке
- 📊 Статистика прогнозов

## 🛠 Технологии

- React 18
- Material UI (MUI)
- Supabase (PostgreSQL + Auth)
- Vite

## 📦 Установка

1. Клонируй репозиторий:
```bash
git clone https://github.com/твой-логин/football-predictions.git
cd football-predictions

# Сруктура проекта
football-predictions/
├── src/                          # Исходный код
│   ├── components/               # React компоненты
│   │   ├── Auth/                 # Авторизация
│   │   │   ├── AuthButton.jsx    # Кнопка входа/выхода
│   │   │   ├── AuthModal.jsx     # Модальное окно логина
│   │   │   └── ProtectedRoute.jsx # Защищённые маршруты
│   │   ├── Calendar/             # Календарь
│   │   │   └── MatchCalendar.jsx # Таблица матчей с прогнозами
│   │   ├── Layout/               # Макет
│   │   │   ├── Layout.jsx        # Обёртка с меню
│   │   │   └── NavMenu.jsx       # Боковое меню (сворачиваемое)
│   │   ├── Profile/              # Профиль
│   │   │   ├── MyPredictions.jsx # Мои прогнозы
│   │   │   ├── ParticipantsList.jsx # Участники (рейтинг)
│   │   │   └── Profile.jsx       # Личный профиль
│   │   ├── MatchCard.jsx         # Карточка матча
│   │   ├── MatchList.jsx         # Список матчей (главная)
│   │   ├── PredictionForm.jsx    # Форма прогноза
│   │   ├── PredictionsTable.jsx  # Таблица прогнозов
│   │   └── ThemeToggle.jsx       # Переключатель темы
│   ├── contexts/                 # React Context
│   │   ├── AuthContext.jsx       # Состояние авторизации
│   │   └── ThemeContext.jsx      # Состояние темы
│   ├── lib/                      # Библиотеки
│   │   └── supabase.js           # Клиент Supabase
│   ├── services/                 # API сервисы
│   │   └── api.js                # Запросы к Supabase
│   ├── App.jsx                   # Корневой компонент
│   ├── main.jsx                  # Точка входа
│   └── theme.js                  # Настройки темы MUI
├── public/                       # Статические файлы
├── .env                          # Переменные окружения (не в git)
├── .env.example                  # Пример переменных (в git)
├── .gitignore                    # Игнорируемые файлы
├── index.html                    # HTML шаблон
├── package.json                  # Зависимости
├── vite.config.js                # Конфигурация Vite
└── README.md                     # Документация