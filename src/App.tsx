import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { useOnline } from './hooks/useOnline';
import { GameMode } from './hooks/useGameState';

type Screen = 'home' | 'lobby' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<GameMode>('local');
  const online = useOnline();

  // Auto-transition lobby → game when opponent joins
  useEffect(() => {
    if (screen === 'lobby' && online.roomCode && !online.waiting && online.connected) {
      setScreen('game');
    }
  }, [screen, online.roomCode, online.waiting, online.connected]);

  const handleStart = (m: GameMode) => {
    setMode(m);
    setScreen(m === 'online' ? 'lobby' : 'game');
  };

  const handleQuit = () => {
    online.reset();
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen onStart={handleStart} />;
  }

  if (screen === 'lobby') {
    return (
      <LobbyScreen
        online={online}
        onBack={handleQuit}
      />
    );
  }

  return (
    <GameScreen
      mode={mode}
      online={mode === 'online' ? online : undefined}
      onQuit={handleQuit}
    />
  );
}
