import { useState, useMemo, useCallback } from 'react';
import {
  GameState,
  Cell,
  Wall,
  PlayerID,
  BOARD_SIZE,
} from '../engine/quoridor';

const CELL = 38;
const GAP = 4;
const STEP = CELL + GAP;
const PAD = 14;
const GRID = PAD * 2 + (BOARD_SIZE - 1) * STEP + CELL;
const WALL_THICK = 4;

const cx = (c: number) => PAD + c * STEP + CELL / 2;
const cy = (r: number) => PAD + r * STEP + CELL / 2;

function wallRect(w: Wall) {
  if (w.orientation === 'horizontal') {
    return {
      x: PAD + w.col * STEP,
      y: PAD + w.row * STEP + CELL,
      width: STEP * 2 - GAP,
      height: WALL_THICK,
    };
  }
  return {
    x: PAD + w.col * STEP + CELL,
    y: PAD + w.row * STEP,
    width: WALL_THICK,
    height: STEP * 2 - GAP,
  };
}

const PLAYER_COLORS = ['#44AAFF', '#FF4444'] as const;
const WALL_COLOR = '#A07828';

interface Props {
  state: GameState;
  validMoves: Cell[];
  validWalls: Wall[];
  wallMode: boolean;
  selectedCell: Cell | null;
  isMyTurn: boolean;
  currentPlayer: PlayerID;
  onCellClick: (cell: Cell) => void;
  onWallSlotClick: (wall: Wall) => void;
}

export function Board({
  state,
  validMoves,
  validWalls,
  wallMode,
  selectedCell,
  isMyTurn,
  currentPlayer,
  onCellClick,
  onWallSlotClick,
}: Props) {
  const [hovered, setHovered] = useState<Wall | null>(null);

  const moveSet = useMemo(
    () => new Set(validMoves.map((m) => `${m.row},${m.col}`)),
    [validMoves],
  );

  const wallSet = useMemo(
    () => new Set(validWalls.map((w) => `${w.row},${w.col},${w.orientation}`)),
    [validWalls],
  );

  const isWallOk = useCallback(
    (w: Wall) => wallSet.has(`${w.row},${w.col},${w.orientation}`),
    [wallSet],
  );

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      className="w-full max-w-[420px] mx-auto select-none touch-none"
      role="img"
      aria-label="Quoridor board"
    >
      <defs>
        <radialGradient id="pawnGrad0" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#77CCFF" />
          <stop offset="100%" stopColor="#3388DD" />
        </radialGradient>
        <radialGradient id="pawnGrad1" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FF7777" />
          <stop offset="100%" stopColor="#DD3333" />
        </radialGradient>
        <filter id="glow0">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#44AAFF" floodOpacity="0.6" />
        </filter>
        <filter id="glow1">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FF4444" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Board background */}
      <rect width={GRID} height={GRID} rx={8} fill="#111111" />

      {/* Grid cells */}
      {Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => {
          const isMove = moveSet.has(`${r},${c}`);
          const isSelected =
            selectedCell?.row === r && selectedCell?.col === c;
          return (
            <rect
              key={`c${r}${c}`}
              x={PAD + c * STEP}
              y={PAD + r * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              fill={
                isSelected
                  ? 'rgba(255,255,255,0.15)'
                  : isMove
                    ? 'rgba(255,255,255,0.06)'
                    : '#1a1a1a'
              }
              stroke={isSelected ? '#ffffff' : '#2a2a2a'}
              strokeWidth={isSelected ? 1.5 : 0.5}
              className={(!wallMode || isMove) ? 'cursor-pointer' : ''}
              onClick={() => onCellClick({ row: r, col: c })}
            />
          );
        }),
      )}

      {/* Valid move dots */}
      {validMoves.map((m, i) => (
        <circle
          key={`mv${i}`}
          cx={cx(m.col)}
          cy={cy(m.row)}
          r={6}
          fill="rgba(255,255,255,0.25)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          className="cursor-pointer"
          onClick={() => onCellClick(m)}
        />
      ))}

      {/* Placed walls */}
      {state.wallsPlaced.map((w, i) => {
        const r = wallRect(w);
        return (
          <rect
            key={`w${i}`}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            rx={1}
            fill={WALL_COLOR}
            opacity={0.9}
          />
        );
      })}

      {/* Wall placement slots (wall mode) */}
      {wallMode &&
        isMyTurn &&
        Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const hw: Wall = { row: r, col: c, orientation: 'horizontal' };
            const vw: Wall = { row: r, col: c, orientation: 'vertical' };
            const hr = wallRect(hw);
            const vr = wallRect(vw);
            const hOk = isWallOk(hw);
            const vOk = isWallOk(vw);
            const hHov =
              hovered?.row === r &&
              hovered?.col === c &&
              hovered?.orientation === 'horizontal';
            const vHov =
              hovered?.row === r &&
              hovered?.col === c &&
              hovered?.orientation === 'vertical';

            return (
              <g key={`ws${r}${c}`}>
                <rect
                  x={hr.x}
                  y={hr.y - 16}
                  width={hr.width}
                  height={WALL_THICK + 32}
                  fill={
                    hHov
                      ? hOk
                        ? 'rgba(245,158,11,0.3)'
                        : 'rgba(239,68,68,0.15)'
                      : hOk
                        ? 'rgba(245,158,11,0.05)'
                        : 'transparent'
                  }
                  rx={3}
                  className="cursor-pointer"
                  onClick={() => onWallSlotClick(hw)}
                  onMouseEnter={() => hOk && setHovered(hw)}
                  onMouseLeave={() => setHovered(null)}
                />
                {hHov && hOk && (
                  <rect
                    x={hr.x}
                    y={hr.y}
                    width={hr.width}
                    height={hr.height}
                    rx={1}
                    fill="#F59E0B"
                    opacity={0.7}
                  />
                )}

                <rect
                  x={vr.x - 16}
                  y={vr.y}
                  width={WALL_THICK + 32}
                  height={vr.height}
                  fill={
                    vHov
                      ? vOk
                        ? 'rgba(245,158,11,0.3)'
                        : 'rgba(239,68,68,0.15)'
                      : vOk
                        ? 'rgba(245,158,11,0.05)'
                        : 'transparent'
                  }
                  rx={3}
                  className="cursor-pointer"
                  onClick={() => onWallSlotClick(vw)}
                  onMouseEnter={() => vOk && setHovered(vw)}
                  onMouseLeave={() => setHovered(null)}
                />
                {vHov && vOk && (
                  <rect
                    x={vr.x}
                    y={vr.y}
                    width={vr.width}
                    height={vr.height}
                    rx={1}
                    fill="#F59E0B"
                    opacity={0.7}
                  />
                )}
              </g>
            );
          }),
        )}

      {/* Pawns */}
      {state.players.map((p, i) => {
        const isActive = currentPlayer === i && !state.gameOver;
        return (
          <g
            key={`p${i}`}
            style={{
              transform: `translate(${cx(p.col)}px, ${cy(p.row)}px)`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow for active player */}
            {isActive && (
              <circle
                cx={0}
                cy={0}
                r={20}
                fill="none"
                stroke={PLAYER_COLORS[i]}
                strokeWidth={2}
                opacity={0.3}
              >
                <animate
                  attributeName="r"
                  values="18;22;18"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0.3"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            {/* Pawn body */}
            <circle
              cx={0}
              cy={0}
              r={16}
              fill={`url(#pawnGrad${i})`}
              filter={isActive ? `url(#glow${i})` : undefined}
            />
            {/* Shine highlight */}
            <circle
              cx={-4}
              cy={-5}
              r={5}
              fill="rgba(255,255,255,0.25)"
            />
          </g>
        );
      })}
    </svg>
  );
}
