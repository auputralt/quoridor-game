# Quoridor

A fully-featured **Quoridor** board game built with React, TypeScript, and WebSocket.

Block your opponent's path. Place walls strategically. Be the first to reach the other side.

## Features

- **AI Opponent** — Play against an AI with easy/hard difficulty (minimax + BFS evaluation)
- **Online Multiplayer** — Real-time 2-player matches via WebSocket (room codes)
- **Local Play** — Pass-and-play on the same screen
- **Validated Rules** — Full rule enforcement: wall placement, path-blocking prevention, pawn movement

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS 3 |
| Build | Vite 6 |
| Multiplayer | WebSocket (ws) |
| AI Engine | Minimax with alpha-beta pruning + BFS distance heuristic |
| Runtime | tsx (dev server) |

## Getting Started

### Prerequisites

- Node.js 18+

### Install

```bash
npm install
```

### Play vs AI / Local

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Online Multiplayer

Run the WebSocket server, then the client:

```bash
# Terminal 1 — game server
npm run server

# Terminal 2 — frontend
npm run dev
```

Open two browser tabs at `http://localhost:5173`, select **Online**, and share the room code.

## Project Structure

```
├── src/
│   ├── ai/quoridorAI.ts        # Minimax AI with alpha-beta pruning
│   ├── engine/quoridor.ts       # Game logic, move validation, BFS
│   ├── components/
│   │   ├── Board.tsx            # Interactive game board
│   │   ├── EndScreen.tsx        # Win/lose screen
│   │   ├── GameScreen.tsx       # Active game UI
│   │   ├── HomeScreen.tsx       # Main menu
│   │   └── LobbyScreen.tsx     # Online lobby
│   ├── hooks/
│   │   ├── useGameState.ts      # Local game state management
│   │   └── useOnline.ts         # WebSocket connection hook
│   ├── App.tsx
│   └── main.tsx
├── server/
│   └── index.ts                 # WebSocket game server
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## How to Play

1. **Move** your pawn (colored dot) one step in any cardinal direction
2. **Place a wall** to block your opponent — walls span 2 cells
3. You cannot completely block a player's path to the goal
4. **Win** by reaching the opposite row from where you started
5. Each player has **10 walls**

## License

MIT
