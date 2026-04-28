/**
 * Graph-based column assignment (Fix issue 1: parallel task alignment).
 *
 * Uses topological sort on FORWARD connections only (backward gateway conditions
 * are excluded to avoid cycles).  Parallel targets (multiple nextTaskIds from the
 * same source) all receive column = source_col + 1, so they appear side-by-side
 * in their respective lanes.
 */
export function computeColumnMap(tasks) {
  const taskIdSet = new Set(tasks.map(t => t.id));
  const arrayIdxOf = {};
  tasks.forEach((t, i) => { arrayIdxOf[t.id] = i; });

  const fwdNext = {};   // taskId → [successorId, ...]
  const inDeg   = {};
  tasks.forEach(t => { fwdNext[t.id] = []; inDeg[t.id] = 0; });

  const addEdge = (fromId, toId) => {
    if (!toId || !taskIdSet.has(toId)) return;
    if (arrayIdxOf[toId] <= arrayIdxOf[fromId]) return; // skip backward / self
    fwdNext[fromId].push(toId);
    inDeg[toId]++;
  };

  tasks.forEach(task => {
    if (task.type === 'gateway') {
      (task.conditions || []).forEach(c => addEdge(task.id, c.nextTaskId));
    } else if (task.type !== 'end') {
      (task.nextTaskIds || []).forEach(nid => addEdge(task.id, nid));
      if (task.nextTaskId) addEdge(task.id, task.nextTaskId); // legacy
    }
  });

  const colOf = {};
  tasks.forEach(t => { colOf[t.id] = 0; });

  // Kahn's algorithm + longest-path column computation
  const queue = tasks.filter(t => inDeg[t.id] === 0).map(t => t.id);
  const rem = { ...inDeg };
  const processed = new Set();

  while (queue.length > 0) {
    const id = queue.shift();
    processed.add(id);
    fwdNext[id].forEach(nid => {
      colOf[nid] = Math.max(colOf[nid], colOf[id] + 1);
      if (--rem[nid] === 0) queue.push(nid);
    });
  }

  // Fallback for tasks not reached by forward processing (cycles / isolated nodes)
  tasks.forEach((t, i) => { if (!processed.has(t.id)) colOf[t.id] = i; });

  return colOf;
}

/**
 * Prevent same-row same-col collisions: if two tasks in the same swimlane land
 * at the same column (e.g. start circle + gateway both at col 0), shift the
 * later-indexed task rightward and propagate the shift forward along the graph
 * so the topological order is preserved. Iterates until stable.
 */
export function resolveRowCollisions(tasks, colOf, taskRowOf) {
  const arrayIdxOf = {};
  tasks.forEach((t, i) => { arrayIdxOf[t.id] = i; });

  const taskIdSet = new Set(tasks.map(t => t.id));
  const successors = {};
  tasks.forEach(t => { successors[t.id] = []; });
  tasks.forEach(task => {
    const nexts = task.type === 'gateway'
      ? (task.conditions || []).map(c => c.nextTaskId)
      : [...(task.nextTaskIds || []), task.nextTaskId].filter(Boolean);
    nexts.forEach(nid => {
      if (!nid || !taskIdSet.has(nid)) return;
      if (arrayIdxOf[nid] <= arrayIdxOf[task.id]) return;
      successors[task.id].push(nid);
    });
  });

  const MAX_ITER = tasks.length * 2 + 2;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const cells = {};
    tasks.forEach(t => {
      const key = `${taskRowOf[t.id]}::${colOf[t.id]}`;
      (cells[key] = cells[key] || []).push(t.id);
    });

    let fixed = false;
    Object.values(cells).forEach(ids => {
      if (ids.length <= 1) return;
      const sorted = ids.slice().sort((a, b) => arrayIdxOf[a] - arrayIdxOf[b]);
      for (let i = 1; i < sorted.length; i++) {
        const id = sorted[i];
        colOf[id] = colOf[id] + 1;
        const queue = [id];
        const visited = new Set();
        while (queue.length) {
          const cur = queue.shift();
          if (visited.has(cur)) continue;
          visited.add(cur);
          successors[cur].forEach(nid => {
            if (colOf[nid] <= colOf[cur]) {
              colOf[nid] = colOf[cur] + 1;
              queue.push(nid);
            }
          });
        }
        fixed = true;
      }
    });
    if (!fixed) break;
  }
}
