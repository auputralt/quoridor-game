import { useState, useEffect, useRef } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { useOnline } from './hooks/useOnline';
import { GameMode } from './hooks/useGameState';

type Screen = 'home' | 'lobby' | 'game';

function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    const play = () => {
      audio.play().catch(() => {});
    };
    play();
    document.addEventListener('click', play, { once: true });
    document.addEventListener('touchstart', play, { once: true });
    return () => {
      document.removeEventListener('click', play);
      document.removeEventListener('touchstart', play);
    };
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src="/Twelve_Moves_Ahead.mp3"
        loop
        preload="auto"
      />
      <button
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.muted = !muted;
            setMuted(!muted);
          }
        }}
        className="fixed bottom-3 right-3 z-50 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:bg-white/15 transition-colors"
        title={muted ? 'Unmute music' : 'Mute music'}
      >
        {muted ? '🔇' : '🎵'}
      </button>
    </>
  );
}

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

  return (
    <>
      <BackgroundMusic />
      {screen === 'home' && <HomeScreen onStart={handleStart} />}
      {screen === 'lobby' && <LobbyScreen online={online} onBack={handleQuit} />}
      {screen === 'game' && (
        <GameScreen
          mode={mode}
          online={mode === 'online' ? online : undefined}
          onQuit={handleQuit}
        />
      )}
    </>
  );
}
