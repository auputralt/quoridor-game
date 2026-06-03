import { useState, useCallback, useRef } from 'react';
import {
  GameState,
  GameAction,
  PlayerID,
  createInitialState,
} from '../engine/quoridor';

export interface UseOnlineReturn {
  gameState: GameState;
  connected: boolean;
  waiting: boolean;
  opponentDisconnected: boolean;
  playerID: PlayerID;
  roomCode: string | null;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  sendMove: (action: GameAction) => void;
  reset: () => void;
}

export function useOnline(): UseOnlineReturn {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [playerID, setPlayerID] = useState<PlayerID>(0);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((onOpen: () => void) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const ws = new WebSocket(`${protocol}//${host}:3001`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onOpen();
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'roomCreated':
          setRoomCode(msg.code);
          setPlayerID(0);
          setWaiting(true);
          break;
        case 'joined':
          setPlayerID(msg.player);
          setRoomCode(msg.code);
          break;
        case 'gameStart':
        case 'stateUpdate':
          setGameState(msg.state);
          setWaiting(false);
          break;
        case 'opponentDisconnected':
          setOpponentDisconnected(true);
          break;
        case 'error':
          console.error('Server:', msg.message);
          break;
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
  }, []);

  const createRoom = useCallback(() => {
    connect(() => {
      wsRef.current?.send(JSON.stringify({ type: 'create' }));
    });
  }, [connect]);

  const joinRoom = useCallback(
    (code: string) => {
      connect(() => {
        wsRef.current?.send(JSON.stringify({ type: 'join', code }));
      });
    },
    [connect]
  );

  const sendMove = useCallback((action: GameAction) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'move', move: action }));
    }
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setGameState(createInitialState());
    setConnected(false);
    setWaiting(false);
    setOpponentDisconnected(false);
    setPlayerID(0);
    setRoomCode(null);
  }, []);

  return {
    gameState,
    connected,
    waiting,
    opponentDisconnected,
    playerID,
    roomCode,
    createRoom,
    joinRoom,
    sendMove,
    reset,
  };
}
