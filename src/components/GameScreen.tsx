import { useEffect, useMemo, useCallback } from 'react';
import { Board } from './Board';
import { EndScreen } from './EndScreen';
import { useGameState, GameMode } from '../hooks/useGameState';
import { UseOnlineReturn } from '../hooks/useOnline';
import {
  getValidMoves,
  getValidWallPlacements,
  PlayerID,
  Cell,
  GameAction,
} from '../engine/quoridor';

const P_COLORS = ['#44AAFF', '#FF4444'];

interface Props {
  mode: GameMode;
  online?: UseOnlineReturn;
  onQuit: () => void;
}

function WallCountBars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-[3px] h-4 rounded-sm"
            style={{
              backgroundColor: i < count ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-white/70 ml-1">{count}</span>
    </div>
  );
}

function PlayerBar({
  playerIndex,
  wallCount,
  isCurrent,
  label,
}: {
  playerIndex: number;
  wallCount: number;
  isCurrent: boolean;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderRadius: 12,
        transition: 'background-color 0.3s',
      }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: P_COLORS[playerIndex] }}
      />
      <span className="text-sm font-semibold text-white flex-1">{label}</span>
      <WallCountBars count={wallCount} />
    </div>
  );
}

export function GameScreen({ mode, online, onQuit }: Props) {
  const isOnline = mode === 'online';
  const local = useGameState(isOnline ? 'local' : mode);

  const state = isOnline ? online!.gameState : local.state;
  const currentPlayer: PlayerID = state.currentPlayer;
  const onlinePid = online?.playerID ?? 0;

  const isMyTurn = isOnline
    ? currentPlayer === onlinePid && !state.gameOver
    : local.isMyTurn;

  const uiValidMoves = useMemo(() => {
    if (state.gameOver || !isMyTurn) return [];
    const pid: PlayerID = isOnline ? onlinePid : currentPlayer;
    return getValidMoves(state, pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isMyTurn, currentPlayer, isOnline, onlinePid]);

  const uiValidWalls = useMemo(() => {
    if (state.gameOver || !isMyTurn) return [];
    const pid: PlayerID = isOnline ? onlinePid : currentPlayer;
    return getValidWallPlacements(state, pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isMyTurn, currentPlayer, isOnline, onlinePid]);

  const wallMode = isOnline ? false : local.wallMode;
  const wallOrientation = isOnline ? 'horizontal' as const : local.wallOrientation;

  const dispatch = useCallback(
    (action: GameAction) => {
      if (isOnline) {
        online!.sendMove(action);
      } else {
        local.handleAction(action);
      }
    },
    [isOnline, online, local],
  );

  const handleCellClick = useCallback(
    (cell: Cell) => {
      if (isOnline) {
        if (!isMyTurn) return;
        if (uiValidMoves.some((m) => m.row === cell.row && m.col === cell.col)) {
          dispatch({ type: 'move', cell });
        }
      } else {
        local.handleCellClick(cell);
      }
    },
    [isOnline, isMyTurn, uiValidMoves, dispatch, local],
  );

  const handleWallSlotClick = useCallback(
    (wall: { row: number; col: number; orientation: 'horizontal' | 'vertical' }) => {
      if (isOnline) {
        if (!isMyTurn) return;
        if (
          uiValidWalls.some(
            (w) => w.row === wall.row && w.col === wall.col && w.orientation === wall.orientation,
          )
        ) {
          dispatch({ type: 'wall', wall });
        }
      } else {
        local.handleWallSlotClick(wall);
      }
    },
    [isOnline, isMyTurn, uiValidWalls, dispatch, local],
  );

  const handlePawnDragEnd = useCallback(
    (cell: Cell) => {
      if (isOnline) {
        if (!isMyTurn) return;
        if (uiValidMoves.some((m) => m.row === cell.row && m.col === cell.col)) {
          dispatch({ type: 'move', cell });
        }
      } else {
        local.handleAction({ type: 'move', cell });
      }
    },
    [isOnline, isMyTurn, uiValidMoves, dispatch, local],
  );

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.gameOver) return;
      if (isOnline && !isMyTurn) return;
      if (!isOnline && !local.isMyTurn) return;

      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (!isOnline) local.toggleWallMode();
        return;
      }

      if (!isOnline && !local.wallMode) {
        const dirMap: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        const dir = dirMap[e.key];
        if (dir) {
          e.preventDefault();
          const myPawn = state.players[currentPlayer];
          const target = { row: myPawn.row + dir[0], col: myPawn.col + dir[1] };
          if (local.validMoves.some((m) => m.row === target.row && m.col === target.col)) {
            local.handleAction({ type: 'move', cell: target });
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentPlayer, isOnline, isMyTurn, local]);

  const turnLabel =
    mode === 'ai-easy' || mode === 'ai-hard'
      ? currentPlayer === 0
        ? 'Your turn'
        : 'AI thinking...'
      : currentPlayer === 0
        ? "Player 1's turn"
        : "Player 2's turn";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between px-4 py-3 relative">
      {/* Top bar: Leave + Player 2 */}
      <div className="w-full max-w-[420px] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onQuit}
            className="text-white/50 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Leave
          </button>
          <button
            onClick={local.resetGame}
            className="text-white/30 text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            ↻
          </button>
        </div>
        <PlayerBar
          playerIndex={1}
          wallCount={state.wallCounts[1]}
          isCurrent={currentPlayer === 1}
          label={isOnline ? 'Opponent' : 'Player 2'}
        />
      </div>

      {/* Board - centered */}
      <div className="w-full max-w-[420px] flex-shrink-0 my-2">
        <Board
          state={state}
          validMoves={uiValidMoves}
          validWalls={uiValidWalls}
          wallMode={wallMode}
          wallOrientation={wallOrientation}
          selectedCell={isOnline ? null : local.selectedCell}
          isMyTurn={isMyTurn}
          currentPlayer={currentPlayer}
          onCellClick={handleCellClick}
          onWallSlotClick={handleWallSlotClick}
          onPawnDragEnd={handlePawnDragEnd}
        />
      </div>

      {/* Bottom bar: Turn + Player 1 + Wall buttons */}
      <div className="w-full max-w-[420px] flex flex-col gap-2">
        {/* Turn indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: P_COLORS[currentPlayer] }}
          />
          <span className="text-white/50 text-xs font-medium">{turnLabel}</span>
        </div>

        <PlayerBar
          playerIndex={0}
          wallCount={state.wallCounts[0]}
          isCurrent={currentPlayer === 0}
          label={isOnline ? 'You' : 'Player 1'}
        />

        {/* Action bar — H / V wall toggle */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1" />
          {!isOnline && (
            <>
              <button
                onClick={() => local.toggleWallMode('horizontal')}
                disabled={!local.isMyTurn || state.gameOver}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  local.wallMode && local.wallOrientation === 'horizontal'
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 text-amber-400 hover:bg-white/15'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                🧱 H
              </button>
              <button
                onClick={() => local.toggleWallMode('vertical')}
                disabled={!local.isMyTurn || state.gameOver}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  local.wallMode && local.wallOrientation === 'vertical'
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 text-amber-400 hover:bg-white/15'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                🧱 V
              </button>
            </>
          )}
        </div>
      </div>

      {/* Online status messages */}
      {isOnline && online?.waiting && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-2xl px-6 py-4 text-white/50 text-sm animate-pulse">
          Waiting for opponent…
        </div>
      )}

      {isOnline && online?.opponentDisconnected && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/80 rounded-2xl px-6 py-4 text-red-300 text-sm">
          Opponent disconnected
        </div>
      )}

      {/* End screen overlay */}
      {state.gameOver && state.winner !== null && (
        <EndScreen
          winner={state.winner}
          onPlayAgain={() => {
            if (isOnline) {
              online?.reset();
              onQuit();
            } else {
              local.resetGame();
            }
          }}
          onMainMenu={onQuit}
        />
      )}
    </div>
  );
}
