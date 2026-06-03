import { PlayerID } from '../engine/quoridor';

const P_COLORS = ['#44AAFF', '#FF4444'];

interface Props {
  winner: PlayerID;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function EndScreen({ winner, onPlayAgain, onMainMenu }: Props) {
  const color = P_COLORS[winner];
  const label = winner === 0 ? 'Player 1' : 'Player 2';

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center max-w-xs w-full mx-4 shadow-2xl">
        {/* Winner pawn */}
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <radialGradient id={`endGrad${winner}`} cx="40%" cy="35%">
                <stop offset="0%" stopColor={winner === 0 ? '#77CCFF' : '#FF7777'} />
                <stop offset="100%" stopColor={color} />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill={`url(#endGrad${winner})`} />
            <circle cx="26" cy="25" r="8" fill="rgba(255,255,255,0.2)" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{label} Wins!</h2>
        <p className="text-white/30 text-sm mb-7">
          Reached the opponent&apos;s baseline
        </p>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3.5 px-4 rounded-2xl font-semibold bg-white text-black hover:bg-white/90 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="flex-1 py-3.5 px-4 rounded-2xl font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
