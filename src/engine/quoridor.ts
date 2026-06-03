export const BOARD_SIZE = 9;
export const WALL_SLOTS = 8;
export const INITIAL_WALLS = 10;

export type PlayerID = 0 | 1;
export type WallOrientation = 'horizontal' | 'vertical';

export interface Cell {
  row: number;
  col: number;
}

export interface Wall {
  row: number;
  col: number;
  orientation: WallOrientation;
  player?: PlayerID;
}

export interface MoveAction {
  type: 'move';
  cell: Cell;
}

export interface WallAction {
  type: 'wall';
  wall: Wall;
}

export type GameAction = MoveAction | WallAction;

export interface GameState {
  players: [Cell, Cell];
  currentPlayer: PlayerID;
  wallsPlaced: Wall[];
  wallCounts: [number, number];
  gameOver: boolean;
  winner: PlayerID | null;
}

export function createInitialState(): GameState {
  return {
    players: [
      { row: BOARD_SIZE - 1, col: Math.floor(BOARD_SIZE / 2) },
      { row: 0, col: Math.floor(BOARD_SIZE / 2) },
    ],
    currentPlayer: 0,
    wallsPlaced: [],
    wallCounts: [INITIAL_WALLS, INITIAL_WALLS],
    gameOver: false,
    winner: null,
  };
}

function opp(p: PlayerID): PlayerID {
  return p === 0 ? 1 : 0;
}

export function isWallBetween(state: GameState, from: Cell, to: Cell): boolean {
  const dr = to.row - from.row;
  const dc = to.col - from.col;

  if (dr === -1 && dc === 0) {
    return state.wallsPlaced.some(
      (w) =>
        w.orientation === 'horizontal' &&
        w.row === to.row &&
        (w.col === from.col || w.col === from.col - 1)
    );
  }
  if (dr === 1 && dc === 0) {
    return state.wallsPlaced.some(
      (w) =>
        w.orientation === 'horizontal' &&
        w.row === from.row &&
        (w.col === from.col || w.col === from.col - 1)
    );
  }
  if (dr === 0 && dc === -1) {
    return state.wallsPlaced.some(
      (w) =>
        w.orientation === 'vertical' &&
        w.col === to.col &&
        (w.row === from.row || w.row === from.row - 1)
    );
  }
  if (dr === 0 && dc === 1) {
    return state.wallsPlaced.some(
      (w) =>
        w.orientation === 'vertical' &&
        w.col === from.col &&
        (w.row === from.row || w.row === from.row - 1)
    );
  }
  return false;
}

export function getValidMoves(state: GameState, player: PlayerID): Cell[] {
  if (state.gameOver) return [];
  const pos = state.players[player];
  const o = opp(player);
  const oppPos = state.players[o];
  const moves: Cell[] = [];
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;

    const isOpp = nr === oppPos.row && nc === oppPos.col;

    if (isOpp) {
      if (isWallBetween(state, pos, oppPos)) continue;

      const jr = oppPos.row + dr;
      const jc = oppPos.col + dc;
      const straightBlocked =
        jr < 0 ||
        jr >= BOARD_SIZE ||
        jc < 0 ||
        jc >= BOARD_SIZE ||
        isWallBetween(state, oppPos, { row: jr, col: jc });

      if (!straightBlocked) {
        moves.push({ row: jr, col: jc });
      } else {
        const diags: Cell[] = [
          { row: oppPos.row + dc, col: oppPos.col - dr },
          { row: oppPos.row - dc, col: oppPos.col + dr },
        ];
        for (const d of diags) {
          if (d.row < 0 || d.row >= BOARD_SIZE || d.col < 0 || d.col >= BOARD_SIZE) continue;
          if (isWallBetween(state, oppPos, d)) continue;
          if (
            (state.players[0].row === d.row && state.players[0].col === d.col) ||
            (state.players[1].row === d.row && state.players[1].col === d.col)
          ) continue;
          if (!moves.some((m) => m.row === d.row && m.col === d.col)) {
            moves.push(d);
          }
        }
      }
    } else {
      if (isWallBetween(state, pos, { row: nr, col: nc })) continue;
      if (
        (state.players[0].row === nr && state.players[0].col === nc) ||
        (state.players[1].row === nr && state.players[1].col === nc)
      ) continue;
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

export function bfsDistance(state: GameState, player: PlayerID): number {
  const start = state.players[player];
  const goalRow = player === 0 ? 0 : BOARD_SIZE - 1;
  const visited = new Uint8Array(BOARD_SIZE * BOARD_SIZE);
  const dist = new Int16Array(BOARD_SIZE * BOARD_SIZE);
  const si = start.row * BOARD_SIZE + start.col;
  visited[si] = 1;
  const queue: number[] = [si];
  let head = 0;
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (head < queue.length) {
    const idx = queue[head++];
    const r = (idx / BOARD_SIZE) | 0;
    const c = idx % BOARD_SIZE;
    if (r === goalRow) return dist[idx];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
      const ni = nr * BOARD_SIZE + nc;
      if (visited[ni]) continue;
      if (isWallBetween(state, { row: r, col: c }, { row: nr, col: nc })) continue;
      visited[ni] = 1;
      dist[ni] = dist[idx] + 1;
      queue.push(ni);
    }
  }
  return Infinity;
}

export function hasPathToGoal(state: GameState, player: PlayerID): boolean {
  return bfsDistance(state, player) !== Infinity;
}

function wallOverlaps(state: GameState, wall: Wall): boolean {
  return state.wallsPlaced.some((w) => {
    if (w.orientation !== wall.orientation) return false;
    if (w.orientation === 'horizontal') {
      return w.row === wall.row && Math.abs(w.col - wall.col) <= 1;
    }
    return w.col === wall.col && Math.abs(w.row - wall.row) <= 1;
  });
}

export function getValidWallPlacements(state: GameState, player: PlayerID): Wall[] {
  if (state.wallCounts[player] <= 0 || state.gameOver) return [];
  const placements: Wall[] = [];

  for (let r = 0; r < WALL_SLOTS; r++) {
    for (let c = 0; c < WALL_SLOTS; c++) {
      for (const orientation of ['horizontal', 'vertical'] as WallOrientation[]) {
        const wall: Wall = { row: r, col: c, orientation };
        if (wallOverlaps(state, wall)) continue;
        const testState: GameState = {
          ...state,
          wallsPlaced: [...state.wallsPlaced, wall],
        };
        if (hasPathToGoal(testState, 0) && hasPathToGoal(testState, 1)) {
          placements.push(wall);
        }
      }
    }
  }
  return placements;
}

export function checkWin(state: GameState): PlayerID | null {
  if (state.players[0].row === 0) return 0;
  if (state.players[1].row === BOARD_SIZE - 1) return 1;
  return null;
}

export function applyMove(state: GameState, action: GameAction): GameState {
  if (state.gameOver) return state;

  const ns: GameState = {
    players: [{ ...state.players[0] }, { ...state.players[1] }],
    currentPlayer: state.currentPlayer,
    wallsPlaced: [...state.wallsPlaced],
    wallCounts: [state.wallCounts[0], state.wallCounts[1]],
    gameOver: false,
    winner: null,
  };

  if (action.type === 'move') {
    ns.players[state.currentPlayer] = { ...action.cell };
  } else {
    ns.wallsPlaced.push({ ...action.wall, player: state.currentPlayer });
    ns.wallCounts[state.currentPlayer]--;
  }

  const w = checkWin(ns);
  if (w !== null) {
    ns.gameOver = true;
    ns.winner = w;
  }
  ns.currentPlayer = opp(state.currentPlayer);
  return ns;
}
