import { useState, useCallback, useEffect } from 'react';
import {
  GameState,
  GameAction,
  Cell,
  Wall,
  createInitialState,
  applyMove,
  getValidMoves,
  getValidWallPlacements,
} from '../engine/quoridor';
import { getAIMove } from '../ai/quoridorAI';

export type GameMode = 'local' | 'ai-easy' | 'ai-hard' | 'online';

export function useGameState(mode: GameMode) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [wallMode, setWallMode] = useState(false);
  const [wallOrientation, setWallOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    if (
      (mode === 'ai-easy' || mode === 'ai-hard') &&
      state.currentPlayer === 1 &&
      !state.gameOver
    ) {
      const timer = setTimeout(() => {
        const diff: 'easy' | 'hard' = mode === 'ai-easy' ? 'easy' : 'hard';
        setState((prev) => applyMove(prev, getAIMove(prev, diff)));
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.gameOver, mode]);

  const isMyTurn =
    mode === 'ai-easy' || mode === 'ai-hard'
      ? state.currentPlayer === 0 && !state.gameOver
      : !state.gameOver;

  const validMoves =
    isMyTurn && mode !== 'online'
      ? getValidMoves(state, state.currentPlayer)
      : [];
  const validWalls =
    isMyTurn && mode !== 'online'
      ? getValidWallPlacements(state, state.currentPlayer)
      : [];

  const handleAction = useCallback((action: GameAction) => {
    setState((prev) => applyMove(prev, action));
    setSelectedCell(null);
    setWallMode(false);
    setWallOrientation('horizontal');
  }, []);

  const handleCellClick = useCallback(
    (cell: Cell) => {
      if (!isMyTurn || state.gameOver || wallMode) return;
      const myPawn = state.players[state.currentPlayer];

      if (cell.row === myPawn.row && cell.col === myPawn.col) {
        setSelectedCell((prev) =>
          prev?.row === cell.row && prev.col === cell.col ? null : cell
        );
        return;
      }

      if (selectedCell) {
        if (validMoves.some((m) => m.row === cell.row && m.col === cell.col)) {
          handleAction({ type: 'move', cell });
        } else {
          setSelectedCell(null);
        }
      }
    },
    [isMyTurn, state, wallMode, selectedCell, validMoves, handleAction]
  );

  const handleWallSlotClick = useCallback(
    (wall: Wall) => {
      if (!isMyTurn || state.gameOver || !wallMode) return;
      if (
        validWalls.some(
          (w) =>
            w.row === wall.row &&
            w.col === wall.col &&
            w.orientation === wall.orientation
        )
      ) {
        handleAction({ type: 'wall', wall });
      }
    },
    [isMyTurn, state.gameOver, wallMode, validWalls, handleAction]
  );

  const toggleWallMode = useCallback((orientation?: 'horizontal' | 'vertical') => {
    if (!isMyTurn || state.gameOver) return;
    setWallMode((prev) => {
      if (!prev) {
        // entering wall mode — set orientation
        if (orientation) setWallOrientation(orientation);
      }
      return !prev;
    });
    setSelectedCell(null);
  }, [isMyTurn, state.gameOver]);

  const resetGame = useCallback(() => {
    setState(createInitialState());
    setSelectedCell(null);
    setWallMode(false);
    setWallOrientation('horizontal');
  }, []);

  return {
    state,
    selectedCell,
    wallMode,
    wallOrientation,
    isMyTurn,
    validMoves,
    validWalls,
    handleCellClick,
    handleWallSlotClick,
    toggleWallMode,
    setSelectedCell,
    resetGame,
    handleAction,
  };
}
