import { LAYOUT } from './constants.js';

const { LANE_HEADER_W, COL_W, LANE_H, TITLE_H, NODE_W, NODE_H, DIAMOND_SIZE, CIRCLE_R } = LAYOUT;

function halfExtent(type, axis) {
  if (type === 'gateway') return DIAMOND_SIZE;
  if (type === 'start' || type === 'end') return CIRCLE_R;
  return axis === 'x' ? NODE_W / 2 : NODE_H / 2;
}

/**
 * For a gateway at fromPos connecting to a target at toPos,
 * determine the correct exit and entry sides based on relative position.
 *
 * Cases (per user spec):
 *   target above (row < gateway row)     → exit TOP,    enter LEFT
 *   same row, adjacent (col+1)            → exit RIGHT,  enter LEFT
 *   same row, non-adjacent (skip/loop)    → exit BOTTOM, enter BOTTOM (route below lane)
 *   target below (row > gateway row)      → exit BOTTOM, enter LEFT
 */
function getGatewayExitEntry(fromPos, toPos) {
  const dr = toPos.row - fromPos.row;
  const dc = toPos.col - fromPos.col;

  if (dr < 0) return { exitSide: 'top',    entrySide: 'left' };
  if (dr > 0) return { exitSide: 'bottom', entrySide: 'left' };
  if (dc === 1) return { exitSide: 'right', entrySide: 'left' };
  // same lane, skip or backward loop → route below the lane nodes
  return { exitSide: 'bottom', entrySide: 'bottom' };
}

export function computeLayout(flow) {
  const { roles, tasks, l3Number } = flow;

  const roleIndexMap = {};
  roles.forEach((r, i) => { roleIndexMap[r.id] = i; });

  const positions = {};
  const l4Numbers = {};

  // Only 'task' type gets L4 numbers
  let taskCounter = 1;
  tasks.forEach((task, colIdx) => {
    const row = roleIndexMap[task.roleId] ?? 0;
    const cx = LANE_HEADER_W + colIdx * COL_W + COL_W / 2;
    const cy = TITLE_H + row * LANE_H + LANE_H / 2;
    const hx = halfExtent(task.type, 'x');
    const hy = halfExtent(task.type, 'y');

    positions[task.id] = {
      col: colIdx, row, cx, cy,
      right:  { x: cx + hx, y: cy },
      left:   { x: cx - hx, y: cy },
      bottom: { x: cx,      y: cy + hy },
      top:    { x: cx,      y: cy - hy },
    };

    l4Numbers[task.id] = task.type === 'task' ? `${l3Number}.${taskCounter++}` : null;
  });

  const connections = [];
  const taskIdSet = new Set(tasks.map(t => t.id));

  tasks.forEach(task => {
    const fromPos = positions[task.id];

    if (task.type === 'gateway' && task.conditions?.length > 0) {
      task.conditions.forEach(cond => {
        if (!cond.nextTaskId || !taskIdSet.has(cond.nextTaskId)) return;
        const toTask = tasks.find(t => t.id === cond.nextTaskId);
        if (!toTask) return;
        const toPos = positions[toTask.id];
        const { exitSide, entrySide } = getGatewayExitEntry(fromPos, toPos);
        // For same-lane skip routing, pre-compute the y of the routing line
        // (12px above the lane bottom border, safely below all node shapes)
        const laneBottomY = entrySide === 'bottom'
          ? TITLE_H + fromPos.row * LANE_H + (LANE_H - 12)
          : undefined;
        connections.push({ fromId: task.id, toId: toTask.id, label: cond.label, exitSide, entrySide, laneBottomY });
      });
    } else if (task.type !== 'end' && task.type !== 'gateway' && task.nextTaskId && taskIdSet.has(task.nextTaskId)) {
      const toTask = tasks.find(t => t.id === task.nextTaskId);
      if (!toTask) return;
      connections.push({ fromId: task.id, toId: toTask.id, label: '', exitSide: 'right', entrySide: 'left', laneBottomY: undefined });
    }
  });

  const svgWidth  = LANE_HEADER_W + tasks.length * COL_W + LAYOUT.PADDING_RIGHT;
  const svgHeight = TITLE_H + roles.length * LANE_H + LAYOUT.PADDING_BOTTOM;

  return { positions, connections, l4Numbers, svgWidth, svgHeight };
}

/**
 * Returns an array of [x, y] waypoints for a 90-degree-only arrow path.
 *
 * exitSide / entrySide: 'top' | 'right' | 'bottom' | 'left'
 * laneBottomY: y-coordinate of the below-lane routing line (for bottom→bottom paths)
 */
export function routeArrow(fromPos, toPos, exitSide, entrySide, laneBottomY) {
  const sx = fromPos[exitSide].x;
  const sy = fromPos[exitSide].y;
  const tx = toPos[entrySide].x;
  const ty = toPos[entrySide].y;

  // Degenerate: same point
  if (Math.abs(sx - tx) < 1 && Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];

  // Straight horizontal
  if (Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];

  // Straight vertical
  if (Math.abs(sx - tx) < 1) return [[sx, sy], [tx, ty]];

  // ── Same-lane skip/loop: bottom exit → bottom entry ──────────────
  // Route BELOW the node shapes in the same lane, then back up to target bottom.
  if (exitSide === 'bottom' && entrySide === 'bottom') {
    const routeY = laneBottomY ?? (Math.max(sy, ty) + 24);
    return [[sx, sy], [sx, routeY], [tx, routeY], [tx, ty]];
  }

  // ── Target above: top exit → left entry ─────────────────────────
  // Go up from gateway top to mid-row, turn horizontal to target left.
  if (exitSide === 'top') {
    const midY = (sy + ty) / 2;
    return [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
  }

  // ── Target below / forward: bottom exit → left entry ────────────
  if (exitSide === 'bottom' && entrySide === 'left') {
    if (sx <= tx) {
      // Forward-right: down then right
      const midY = sy + (ty - sy) / 2;
      return [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
    }
    // Target is to the left and below: go down a bit then left
    const belowY = sy + 32;
    return [[sx, sy], [sx, belowY], [tx, belowY], [tx, ty]];
  }

  // ── Standard: right exit → left entry (sequential tasks) ────────
  if (exitSide === 'right' && sx < tx) {
    const midX = (sx + tx) / 2;
    return [[sx, sy], [midX, sy], [midX, ty], [tx, ty]];
  }

  // ── Backward sequential: route above the title bar ───────────────
  const topY = TITLE_H - 22;
  return [[sx, sy], [sx + 18, sy], [sx + 18, topY], [tx - 18, topY], [tx - 18, ty], [tx, ty]];
}
