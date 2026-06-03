import { useState } from 'react';
import { GameMode } from '../hooks/useGameState';

interface Props {
  onStart: (mode: GameMode) => void;
}

export function HomeScreen({ onStart }: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
  const [showDifficulty, setShowDifficulty] = useState(false);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-sm w-full space-y-10">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Quoridor
          </h1>
          <p className="text-white/30 mt-2 text-sm tracking-wide">
            Block paths. Reach the other side.
          </p>
        </div>

        {/* Menu buttons */}
        <div className="space-y-3">
          {/* Play vs AI */}
          {!showDifficulty ? (
            <button
              onClick={() => setShowDifficulty(true)}
              className="w-full py-4 px-6 rounded-2xl font-semibold text-lg bg-white text-black hover:bg-white/90 transition-all active:scale-[0.98]"
            >
              Play vs AI
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in">
              <p className="text-xs text-white/40 text-center uppercase tracking-widest">
                Difficulty
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    difficulty === 'easy'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/50 hover:bg-white/15'
                  }`}
                >
                  Easy
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    difficulty === 'hard'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/50 hover:bg-white/15'
                  }`}
                >
                  Hard
                </button>
              </div>
              <button
                onClick={() => onStart(`ai-${difficulty}` as GameMode)}
                className="w-full py-3 rounded-xl font-semibold bg-white text-black hover:bg-white/90 transition-all"
              >
                Start
              </button>
              <button
                onClick={() => setShowDifficulty(false)}
                className="w-full py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Local 2-Player */}
          <button
            onClick={() => onStart('local')}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg bg-white/10 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
          >
            Local 2-Player
          </button>

          {/* Online */}
          <button
            onClick={() => onStart('online')}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg bg-white/10 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
          >
            Play Online
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-xs">
          Use arrow keys to move · W to place walls
        </p>
      </div>
    </div>
  );
}
