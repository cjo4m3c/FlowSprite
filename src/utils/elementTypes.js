/**
 * elementTypes.js — Single source of truth for the unified "元件類型" catalog.
 * Mirrors InsertPicker (DrawerContent.jsx) and ConvertSubForm (subforms.jsx)
 * so the editor's TaskCard Row 2, the diagram's "新增" / "轉換為..." menus,
 * and the drawer's insert picker all show the same 8 options in the same
 * order.
 *
 * Naming convention (audited 2026-04-30):
 *   xor → 排他閘道 (NOT「條件閘道」/「條件」). 條件 is reserved for the *connection
 *   text* (條件分支至 X) — not the gateway type. AND → 並行閘道, OR → 包容閘道.
 */
import { generateId } from './storage.js';
import { applyGatewayPrefix } from './taskDefs.js';

// User-pickable element types in canonical order (matches InsertPicker).
// Breakpoint is intentionally excluded — phased out 2026-04-29; legacy data
// still renders but no UI creates new ones. detectElementKind handles the
// legacy breakpoint round-trip.
export const ELEMENT_TYPES = [
  { value: 'task',         label: 'L4 任務' },
  { value: 'gateway-xor',  label: '排他閘道（XOR）' },
  { value: 'gateway-and',  label: '並行閘道（AND）' },
  { value: 'gateway-or',   label: '包容閘道（OR）' },
  { value: 'start',        label: '開始事件' },
  { value: 'end',          label: '結束事件' },
  { value: 'l3activity',   label: 'L3 流程（子流程調用）' },
  { value: 'interaction',  label: '外部互動' },
];

/**
 * Inverse of makeTypeChange — given an existing task, return its element-type
 * kind (one of the ELEMENT_TYPES values, plus 'breakpoint' for legacy data).
 * Used as the current value of the 元件類型 dropdown.
 */
export function detectElementKind(task) {
  if (task.type === 'start') return 'start';
  if (task.type === 'end') {
    return task.connectionType === 'breakpoint' ? 'breakpoint' : 'end';
  }
  if (task.type === 'l3activity') return 'l3activity';
  if (task.shapeType === 'interaction') return 'interaction';
  if (task.type === 'gateway') return `gateway-${task.gatewayType || 'xor'}`;
  return 'task';
}

/**
 * Pure transform: task + kind → converted task. Same logic as
 * useFlowActions.convertTaskType but without touching the flow store, so it
 * can be called inline from TaskCard's onUpdate. The action wrapper simply
 * does `patch({ tasks: tasks.map(t => t.id===id ? makeTypeChange(t, kind) : t) })`.
 *
 * Connection rewiring is best-effort — gateway↔non-gateway transitions can't
 * perfectly map (conditions vs nextTaskIds), so we collapse to the first
 * available target and the user re-wires extras manually.
 *
 * Side effects on the returned object:
 *   - Strips l4Number (auto re-derived by computeDisplayLabels)
 *   - Clears connectionOverrides (key semantics flip between gateway/non-gateway)
 *   - Adds/removes "[XX閘道] " name prefix based on direction
 */
export function makeTypeChange(task, kind) {
  const existingTarget =
    task.type === 'gateway'
      ? (task.conditions || []).map(c => c.nextTaskId).filter(Boolean)[0] || ''
      : (task.nextTaskIds || []).filter(Boolean)[0] || '';
  let overrides;
  if (kind === 'task') {
    overrides = { type: 'task', shapeType: 'task', connectionType: 'sequence',
      nextTaskIds: existingTarget ? [existingTarget] : [''], conditions: [] };
  } else if (kind === 'l3activity') {
    overrides = { type: 'l3activity', shapeType: 'l3activity', connectionType: 'subprocess',
      nextTaskIds: existingTarget ? [existingTarget] : [''], conditions: [] };
  } else if (kind === 'interaction') {
    overrides = { type: 'task', shapeType: 'interaction', connectionType: 'sequence',
      nextTaskIds: existingTarget ? [existingTarget] : [''], conditions: [] };
  } else if (kind === 'start') {
    overrides = { type: 'start', shapeType: 'task', connectionType: 'start',
      nextTaskIds: existingTarget ? [existingTarget] : [''], conditions: [] };
  } else if (kind === 'end') {
    overrides = { type: 'end', shapeType: 'task', connectionType: 'end',
      nextTaskIds: [], conditions: [] };
  } else if (kind === 'breakpoint') {
    overrides = { type: 'end', shapeType: 'task', connectionType: 'breakpoint',
      nextTaskIds: [], conditions: [] };
  } else if (kind === 'gateway-xor' || kind === 'gateway-and' || kind === 'gateway-or') {
    const gType = kind.slice(8);
    const ctMap = { xor: 'conditional-branch', and: 'parallel-branch', or: 'inclusive-branch' };
    const existingConds = task.type === 'gateway' ? (task.conditions || []) : [];
    const conditions = existingConds.length
      ? existingConds
      : [{ id: generateId(), label: '', nextTaskId: existingTarget || '' }];
    overrides = {
      type: 'gateway', shapeType: 'task', gatewayType: gType,
      connectionType: ctMap[gType],
      name: applyGatewayPrefix(task.name, gType),
      nextTaskIds: [], conditions,
    };
  } else {
    return task;
  }
  const cleanedName = task.type === 'gateway' && !kind.startsWith('gateway-')
    ? applyGatewayPrefix(task.name, null)
    : (overrides.name ?? task.name);
  return {
    ...task, ...overrides, name: cleanedName,
    l4Number: undefined,
    connectionOverrides: {},
  };
}

/**
 * Auto-sync rule (2026-04-30): tasks living in an external-role lane should
 * use the 外部關係人互動 element (shapeType='interaction'); tasks in internal
 * lanes use the regular L4 task element (shapeType='task'). Other element
 * types (gateway / start / end / l3activity) are lane-agnostic and stay
 * untouched by this sync.
 *
 * Trigger points:
 *   1. Task's roleId changes (user moves task between lanes) → applyRoleChange
 *   2. Role's type changes (user flips a lane internal↔external) → cascade
 *      via syncTasksToRoles over all tasks in that role
 *   3. Flow loaded from localStorage / Excel → one-time fixup via
 *      syncTasksToRoles inside storage.migrateFlow
 *
 * Scope: only flips between shapeType 'task' ↔ 'interaction'. type stays
 * 'task' in both cases (interaction is just a shape variant of a task,
 * not a separate element kind for routing purposes).
 */
function isLaneSensitive(task) {
  // Only regular tasks and interaction tasks swap based on lane.
  // type='task' covers both shapeType='task' and shapeType='interaction'.
  return task.type === 'task'
    && (task.shapeType === 'task' || task.shapeType === 'interaction');
}

/** Move a task to a new role; auto-sync shapeType based on the role's type. */
export function applyRoleChange(task, newRoleId, roles) {
  if (!isLaneSensitive(task)) return { ...task, roleId: newRoleId };
  const newRole = (roles || []).find(r => r.id === newRoleId);
  const targetShape = newRole?.type === 'external' ? 'interaction' : 'task';
  if (task.shapeType === targetShape && task.roleId === newRoleId) return task;
  return { ...task, roleId: newRoleId, shapeType: targetShape };
}

/**
 * Cascade-sync every task's shapeType against the current roles list. Used
 * when a role's type flips (one role change → all of its tasks need to swap
 * shape) and as a one-time fixup on load. Idempotent — returns the same
 * array reference when no changes needed.
 */
export function syncTasksToRoles(tasks, roles) {
  if (!Array.isArray(tasks) || !Array.isArray(roles)) return tasks;
  const roleById = new Map(roles.map(r => [r.id, r]));
  let changed = false;
  const next = tasks.map(t => {
    if (!isLaneSensitive(t) || !t.roleId) return t;
    const role = roleById.get(t.roleId);
    if (!role) return t;
    const targetShape = role.type === 'external' ? 'interaction' : 'task';
    if (t.shapeType === targetShape) return t;
    changed = true;
    return { ...t, shapeType: targetShape };
  });
  return changed ? next : tasks;
}
