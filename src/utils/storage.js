const FLOWS_KEY = 'bpm_flows_v1';

export function loadFlows() {
  try {
    const raw = localStorage.getItem(FLOWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFlow(flow) {
  const flows = loadFlows();
  const idx = flows.findIndex(f => f.id === flow.id);
  const now = new Date().toISOString();
  const updated = { ...flow, updatedAt: now };
  if (idx >= 0) {
    flows[idx] = updated;
  } else {
    flows.push({ ...updated, createdAt: now });
  }
  localStorage.setItem(FLOWS_KEY, JSON.stringify(flows));
}

export function deleteFlow(flowId) {
  const flows = loadFlows().filter(f => f.id !== flowId);
  localStorage.setItem(FLOWS_KEY, JSON.stringify(flows));
}

export function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
