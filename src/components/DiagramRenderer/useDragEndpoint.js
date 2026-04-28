import { useState } from 'react';
import { screenToSvg, nearestSide, findTaskAtPoint } from './dragHelpers.js';

/**
 * Drag state machine for connection endpoint manipulation.
 *
 * Owns `dragInfo` state and exposes startDrag / moveDrag / endDrag handlers
 * that mutate it. The parent component still owns `selectedConnKey` and the
 * connection list / positions; this hook just encapsulates the pointer-event
 * choreography.
 *
 * Drop semantics on endDrag:
 *   - Target handle dropped on a different valid task → onChangeTarget
 *     (PR J change-target)
 *   - Otherwise snap to nearest side of original anchor task → onUpdateOverride
 *     (PR G manual port override)
 */
export function useDragEndpoint({ svgRef, flow, positions, connections, editable,
  onUpdateOverride, onChangeTarget }) {
  const [dragInfo, setDragInfo] = useState(null);

  function startDrag(evt, connKey, endpoint) {
    if (!editable) return;
    evt.preventDefault();
    evt.stopPropagation();
    const target = evt.currentTarget;
    const pointerId = evt.pointerId;
    try { target.setPointerCapture?.(pointerId); } catch {}
    const [sx, sy] = screenToSvg(svgRef.current, evt);
    setDragInfo({ connKey, endpoint, pointerId, cursor: [sx, sy], proposedSide: null });
  }

  function moveDrag(evt) {
    if (!dragInfo) return;
    evt.preventDefault();
    const [sx, sy] = screenToSvg(svgRef.current, evt);
    const idx = parseInt(dragInfo.connKey.slice(1), 10);
    const conn = connections[idx];
    if (!conn) return;
    const anchorId = dragInfo.endpoint === 'source' ? conn.fromId : conn.toId;
    const pos = positions[anchorId];
    if (!pos) return;
    const proposedSide = nearestSide(pos, sx, sy);
    // For target-handle drag, also detect drop-on-different-task (PR J) for
    // change-target. Highlighted in render so user sees where the new
    // connection will land. Reject self-loop (drop on source) and start
    // events (no incoming allowed). Drop on the original target task is
    // NOT a "change target" — that falls through to the port-snap branch.
    let dropTargetId = null;
    if (dragInfo.endpoint === 'target' && onChangeTarget) {
      const hitId = findTaskAtPoint(flow.tasks, positions, sx, sy);
      if (hitId && hitId !== conn.fromId && hitId !== conn.toId) {
        const hitTask = flow.tasks.find(t => t.id === hitId);
        if (hitTask && hitTask.type !== 'start') dropTargetId = hitId;
      }
    }
    setDragInfo({ ...dragInfo, cursor: [sx, sy], proposedSide, dropTargetId });
  }

  function endDrag(evt) {
    if (!dragInfo) return;
    evt.preventDefault();
    const idx = parseInt(dragInfo.connKey.slice(1), 10);
    const conn = connections[idx];
    if (!conn) { setDragInfo(null); return; }

    // Priority 1 — PR J: target handle dropped on a different valid task →
    // change the connection's target. Snap port = nearest side of new target
    // to the drop coordinate.
    if (dragInfo.dropTargetId && dragInfo.endpoint === 'target' && onChangeTarget) {
      const newTargetId = dragInfo.dropTargetId;
      const newPos = positions[newTargetId];
      const [sx, sy] = dragInfo.cursor;
      const snapSide = newPos ? nearestSide(newPos, sx, sy) : 'left';
      onChangeTarget(conn.fromId, conn.overrideKey, newTargetId, snapSide);
      setDragInfo(null);
      return;
    }

    // Priority 2 — PR G: snap to nearest port of the original anchor task.
    if (dragInfo.proposedSide && onUpdateOverride) {
      const currentSide = dragInfo.endpoint === 'source' ? conn.exitSide : conn.entrySide;
      if (dragInfo.proposedSide !== currentSide) {
        const partial = dragInfo.endpoint === 'source'
          ? { exitSide: dragInfo.proposedSide }
          : { entrySide: dragInfo.proposedSide };
        onUpdateOverride(conn.fromId, conn.overrideKey, partial);
      }
    }
    setDragInfo(null);
  }

  return { dragInfo, setDragInfo, startDrag, moveDrag, endDrag };
}
