import { WebSocketServer, WebSocket } from 'ws';
import {
  createInitialState,
  applyMove,
  getValidMoves,
  getValidWallPlacements,
  GameAction,
  PlayerID,
  GameState,
} from '../src/engine/quoridor';

interface Room {
  code: string;
  players: [WebSocket | null, WebSocket | null];
  state: GameState;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

function broadcast(room: Room, msg: object) {
  const data = JSON.stringify(msg);
  for (const p of room.players) {
    if (p && p.readyState === WebSocket.OPEN) {
      p.send(data);
    }
  }
}

function isActionValid(state: GameState, player: PlayerID, action: GameAction): boolean {
  if (state.gameOver) return false;
  if (state.currentPlayer !== player) return false;

  if (action.type === 'move') {
    return getValidMoves(state, player).some(
      (m) => m.row === action.cell.row && m.col === action.cell.col,
    );
  }
  return getValidWallPlacements(state, player).some(
    (w) =>
      w.row === action.wall.row &&
      w.col === action.wall.col &&
      w.orientation === action.wall.orientation,
  );
}

const wss = new WebSocketServer({ port: 3001 });
console.log('WebSocket server running on ws://localhost:3001');

wss.on('connection', (ws) => {
  let room: Room | null = null;
  let pid: PlayerID | null = null;

  ws.on('message', (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create': {
        const code = generateCode();
        const r: Room = { code, players: [ws, null], state: createInitialState() };
        rooms.set(code, r);
        room = r;
        pid = 0;
        ws.send(JSON.stringify({ type: 'roomCreated', code }));
        break;
      }

      case 'join': {
        const code: string = msg.code?.toUpperCase();
        if (!code) {
          ws.send(JSON.stringify({ type: 'error', message: 'No code provided' }));
          return;
        }
        const r = rooms.get(code);
        if (!r) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }
        if (r.players[1]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
          return;
        }
        r.players[1] = ws;
        room = r;
        pid = 1;
        ws.send(JSON.stringify({ type: 'joined', player: 1, code }));
        broadcast(r, { type: 'gameStart', state: r.state });
        break;
      }

      case 'move': {
        if (!room || pid === null) return;
        const action: GameAction = msg.move;
        if (!action || !action.type) return;
        if (!isActionValid(room.state, pid, action)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
          return;
        }
        room.state = applyMove(room.state, action);
        broadcast(room, { type: 'stateUpdate', state: room.state });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (room && pid !== null) {
      const oppIdx = pid === 0 ? 1 : 0;
      const opp = room.players[oppIdx];
      if (opp && opp.readyState === WebSocket.OPEN) {
        opp.send(JSON.stringify({ type: 'opponentDisconnected' }));
      }
      rooms.delete(room.code);
    }
  });
});
