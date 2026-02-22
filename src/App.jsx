import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GAME_STATES } from './constants/gameConstants';

// Screens
import BootScreen from './components/screens/BootScreen';
import FactionSelect from './components/screens/FactionSelect';
import DifficultySelect from './components/screens/DifficultySelect';
import MainGame from './components/screens/MainGame';
import Debrief from './components/screens/Debrief';
import AuthScreen from './components/screens/AuthScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen';

// A wrapper component to handle routing based on global state
const GameRouter = () => {
  const { state } = useGame();

  switch (state.gameState) {
    case GAME_STATES.BOOT:
      return <BootScreen />;
    case GAME_STATES.FACTION_SELECT:
      return <FactionSelect />;
    case GAME_STATES.DIFFICULTY_SELECT:
      return <DifficultySelect />;
    case GAME_STATES.MAIN_GAME:
      return <MainGame />;
    case GAME_STATES.DEBRIEF:
      return <Debrief />;
    case GAME_STATES.LEADERBOARD:
      return <LeaderboardScreen />;
    default:
      return <FactionSelect />;
  }
};

const MainRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-crt-black flex items-center justify-center font-mono text-phosphor-green crt">
        <div className="animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Once authenticated, we drop them into the core game provider loops
  return (
    <AudioProvider>
      <GameProvider>
        <GameRouter />
      </GameProvider>
    </AudioProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;
