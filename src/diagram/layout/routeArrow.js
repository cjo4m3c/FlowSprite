import { LAYOUT } from '../constants.js';

const { TITLE_H } = LAYOUT;

/**
 * Returns [x,y] waypoints for a 90°-only arrow path.
 * exitSide / entrySide: 'top' | 'right' | 'bottom' | 'left'
 * laneBottomY: pre-computed routing Y for bottom→bottom paths
 */
export function routeArrow(fromPos, toPos, exitSide, entrySide, laneBottomY, laneTopCorridorY) {
  const sx = fromPos[exitSide].x;
  const sy = fromPos[exitSide].y;
  const tx = toPos[entrySide].x;
  const ty = toPos[entrySide].y;

  // ── Parallel corridors (same side in / out) ───────────────
  // Process BEFORE the degenerate-alignment shortcut below: for same-row
  // bottom→bottom (or same-col top→top, etc.), source & target ports can
  // be perfectly aligned (sy === ty), but we still need to detour via the
  // corridor — the naïve straight line would cut through every element
  // between them.
  if (exitSide === 'bottom' && entrySide === 'bottom') {
    const routeY = laneBottomY ?? (Math.max(sy, ty) + 24);
    return [[sx, sy], [sx, routeY], [tx, routeY], [tx, ty]];
  }
  if (exitSide === 'top' && entrySide === 'top') {
    const corridorY = laneTopCorridorY ?? (Math.min(sy, ty) - 24);
    return [[sx, sy], [sx, corridorY], [tx, corridorY], [tx, ty]];
  }
  if (exitSide === 'left' && entrySide === 'left') {
    const corridorX = Math.min(sx, tx) - 24;
    return [[sx, sy], [corridorX, sy], [corridorX, ty], [tx, ty]];
  }
  if (exitSide === 'right' && entrySide === 'right') {
    const corridorX = Math.max(sx, tx) + 24;
    return [[sx, sy], [corridorX, sy], [corridorX, ty], [tx, ty]];
  }

  // Degenerate: already aligned → single segment (non-parallel cases only)
  if (Math.abs(sx - tx) < 1 && Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];
  if (Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];
  if (Math.abs(sx - tx) < 1) return [[sx, sy], [tx, ty]];

  // ── Vertical exit (top/bottom) → any other entry ──
  // If target sits on the same side of source as the exit (ty would fall back
  // through the source shape with a naive 1-bend), use a corridor detour.
  if (exitSide === 'top' || exitSide === 'bottom') {
    const needsCorridor = (exitSide === 'top' && ty >= sy) || (exitSide === 'bottom' && ty <= sy);
    if (needsCorridor) {
      const corridorY = exitSide === 'top' ? (sy - 24) : (sy + 24);
      return [[sx, sy], [sx, corridorY], [tx, corridorY], [tx, ty]];
    }
    return [[sx, sy], [sx, ty], [tx, ty]];
  }

  // ── Horizontal exit → horizontal entry (opposite sides) ─────
  // right → left: forward midX if target is to the right; else loop above title bar
  if (exitSide === 'right' && entrySide === 'left') {
    if (sx < tx) {
      const midX = (sx + tx) / 2;
      return [[sx, sy], [midX, sy], [midX, ty], [tx, ty]];
    }
    const topY = TITLE_H - 22;
    return [[sx, sy], [sx + 18, sy], [sx + 18, topY], [tx - 18, topY], [tx - 18, ty], [tx, ty]];
  }
  if (exitSide === 'left' && entrySide === 'right') {
    // Backward loop via corridor above title bar
    const topY = TITLE_H - 22;
    return [[sx, sy], [sx - 18, sy], [sx - 18, topY], [tx + 18, topY], [tx + 18, ty], [tx, ty]];
  }

  // ── Horizontal exit → vertical entry (top/bottom): horizontal-first 1-bend ──
  return [[sx, sy], [tx, sy], [tx, ty]];
}
