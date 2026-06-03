import {
  GameState,
  PlayerID,
  GameAction,
  getValidMoves,
  getValidWallPlacements,
  applyMove,
  bfsDistance,
} from '../engine/quoridor';

type Difficulty = 'easy' | 'hard';

function evaluate(state: GameState, player: PlayerID): number {
  if (state.gameOver) {
    if (state.winner === player) return 1000;
    if (state.winner !== null) return -1000;
    return 0;
  }
  const myDist = bfsDistance(state, player);
  const oppDist = bfsDistance(state, player === 0 ? 1 : 0);
  return oppDist - myDist;
}

function getCandidates(state: GameState, depth: number): GameAction[] {
  const player = state.currentPlayer;
  const pawnMoves = getValidMoves(state, player);
  const actions: GameAction[] = pawnMoves.map((cell) => ({
    type: 'move',
    cell,
  }));

  if (state.wallCounts[player] > 0) {
    const walls = getValidWallPlacements(state, player);
    if (walls.length > 0) {
      const o = player === 0 ? 1 : 0;
      const scored = walls.map((w) => {
        const ts = applyMove(state, { type: 'wall', wall: w });
        return {
          wall: w,
          gain: bfsDistance(ts, o) - bfsDistance(ts, player),
        };
      });
      scored.sort((a, b) => b.gain - a.gain);
      const limit = depth >= 3 ? 10 : depth >= 2 ? 5 : 0;
      for (const { wall } of scored.slice(0, limit)) {
        actions.push({ type: 'wall', wall });
      }
    }
  }
  return actions;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: PlayerID
): number {
  if (depth === 0 || state.gameOver) return evaluate(state, maximizingPlayer);

  const isMax = state.currentPlayer === maximizingPlayer;
  const candidates = getCandidates(state, depth);
  let best = isMax ? -Infinity : Infinity;

  for (const action of candidates) {
    const ns = applyMove(state, action);
    const score = minimax(ns, depth - 1, alpha, beta, maximizingPlayer);
    if (isMax) {
      if (score > best) best = score;
      if (best > alpha) alpha = best;
    } else {
      if (score < best) best = score;
      if (best < beta) beta = best;
    }
    if (beta <= alpha) break;
  }
  return best;
}

function getHardMove(state: GameState): GameAction {
  const player = state.currentPlayer;
  const candidates = getCandidates(state, 3);

  for (const c of candidates) {
    if (c.type === 'move') {
      const ns = applyMove(state, c);
      if (ns.gameOver && ns.winner === player) return c;
    }
  }

  let bestAction = candidates[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;

  for (const action of candidates) {
    const ns = applyMove(state, action);
    const score = minimax(ns, 2, alpha, Infinity, player);
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
    if (score > alpha) alpha = score;
  }
  return bestAction;
}

function getEasyMove(state: GameState): GameAction {
  const player = state.currentPlayer;
  const pawnMoves = getValidMoves(state, player);
  const walls = getValidWallPlacements(state, player);

  if (pawnMoves.length === 0 && walls.length > 0) {
    return { type: 'wall', wall: walls[0] };
  }
  if (pawnMoves.length === 0) {
    return { type: 'move', cell: { row: 0, col: 0 } };
  }

  if (walls.length > 0 && Math.random() < 0.35) {
    return {
      type: 'wall',
      wall: walls[Math.floor(Math.random() * walls.length)],
    };
  }

  const advancing = pawnMoves.filter((c) =>
    player === 0
      ? c.row < state.players[player].row
      : c.row > state.players[player].row
  );
  if (advancing.length > 0 && Math.random() < 0.8) {
    return {
      type: 'move',
      cell: advancing[Math.floor(Math.random() * advancing.length)],
    };
  }
  return {
    type: 'move',
    cell: pawnMoves[Math.floor(Math.random() * pawnMoves.length)],
  };
}

export function getAIMove(state: GameState, difficulty: Difficulty): GameAction {
  return difficulty === 'hard' ? getHardMove(state) : getEasyMove(state);
}
