import { useState, useMemo, useCallback, useRef } from 'react';
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

interface DragState {
  playerIndex: number;
  startX: number;
  startY: number;
}

interface Props {
  state: GameState;
  validMoves: Cell[];
  validWalls: Wall[];
  wallMode: boolean;
  wallOrientation: 'horizontal' | 'vertical';
  selectedCell: Cell | null;
  isMyTurn: boolean;
  currentPlayer: PlayerID;
  onCellClick: (cell: Cell) => void;
  onWallSlotClick: (wall: Wall) => void;
  onPawnDragEnd: (cell: Cell) => void;
}

function svgPoint(e: PointerEvent, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * GRID,
    y: ((e.clientY - rect.top) / rect.height) * GRID,
  };
}

function nearestCell(px: number, py: number): Cell {
  return {
    row: Math.round((py - PAD - CELL / 2) / STEP),
    col: Math.round((px - PAD - CELL / 2) / STEP),
  };
}

export function Board({
  state,
  validMoves,
  validWalls,
  wallMode,
  wallOrientation,
  selectedCell,
  isMyTurn,
  currentPlayer,
  onCellClick,
  onWallSlotClick,
  onPawnDragEnd,
}: Props) {
  const [hovered, setHovered] = useState<Wall | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  const canDrag = isMyTurn && !wallMode && !state.gameOver;

  // --- Pawn drag handlers ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, playerIndex: number) => {
      if (!canDrag) return;
      e.preventDefault();
      e.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svgPoint(e.nativeEvent, svg);
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      setDragging({ playerIndex, startX: cx(state.players[playerIndex].col), startY: cy(state.players[playerIndex].row) });
      setDragPos(pt);
    },
    [canDrag, state.players],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !svgRef.current) return;
      e.preventDefault();
      const pt = svgPoint(e.nativeEvent, svgRef.current);
      setDragPos(pt);
    },
    [dragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svgPoint(e.nativeEvent, svg);
      const cell = nearestCell(pt.x, pt.y);
      // Clamp to board
      cell.row = Math.max(0, Math.min(BOARD_SIZE - 1, cell.row));
      cell.col = Math.max(0, Math.min(BOARD_SIZE - 1, cell.col));

      if (moveSet.has(`${cell.row},${cell.col}`)) {
        onPawnDragEnd(cell);
      }
      setDragging(null);
      setDragPos(null);
    },
    [dragging, moveSet, onPawnDragEnd],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${GRID} ${GRID}`}
      className="w-full max-w-[420px] mx-auto select-none"
      style={{ touchAction: 'none' }}
      role="img"
      aria-label="Quoridor board"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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

      {/* Wall placement slots (wall mode — only selected orientation) */}
      {wallMode &&
        isMyTurn &&
        Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const w: Wall = { row: r, col: c, orientation: wallOrientation };
            const wr = wallRect(w);
            const ok = isWallOk(w);
            const isHov =
              hovered?.row === r &&
              hovered?.col === c &&
              hovered?.orientation === wallOrientation;

            return (
              <g key={`ws${r}${c}`}>
                <rect
                  x={wallOrientation === 'horizontal' ? wr.x : wr.x - 16}
                  y={wallOrientation === 'horizontal' ? wr.y - 16 : wr.y}
                  width={wallOrientation === 'horizontal' ? wr.width : WALL_THICK + 32}
                  height={wallOrientation === 'horizontal' ? WALL_THICK + 32 : wr.height}
                  fill={
                    isHov
                      ? ok
                        ? 'rgba(245,158,11,0.3)'
                        : 'rgba(239,68,68,0.15)'
                      : ok
                        ? 'rgba(245,158,11,0.05)'
                        : 'transparent'
                  }
                  rx={3}
                  className="cursor-pointer"
                  onClick={() => onWallSlotClick(w)}
                  onMouseEnter={() => ok && setHovered(w)}
                  onMouseLeave={() => setHovered(null)}
                />
                {isHov && ok && (
                  <rect
                    x={wr.x}
                    y={wr.y}
                    width={wr.width}
                    height={wr.height}
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
        const isDragging = dragging?.playerIndex === i;
        const px = isDragging && dragPos ? dragPos.x : cx(p.col);
        const py = isDragging && dragPos ? dragPos.y : cy(p.row);

        return (
          <g
            key={`p${i}`}
            style={{
              transform: `translate(${px}px, ${py}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: canDrag && currentPlayer === i ? 'grab' : 'default',
            }}
            onPointerDown={(e) => handlePointerDown(e, i)}
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
