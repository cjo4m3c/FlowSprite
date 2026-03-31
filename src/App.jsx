import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Wizard from './components/Wizard.jsx';
import { loadFlows, saveFlow, deleteFlow } from './utils/storage.js';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [flows, setFlows] = useState(() => loadFlows());
  const [editingFlowId, setEditingFlowId] = useState(null);

  function refreshFlows() {
    setFlows(loadFlows());
  }

  function handleNew() {
    setEditingFlowId(null);
    setView('wizard');
  }

  function handleEdit(id) {
    setEditingFlowId(id);
    setView('wizard');
  }

  function handleSave(flow) {
    saveFlow(flow);
    refreshFlows();
    setView('dashboard');
  }

  function handleDelete(id) {
    deleteFlow(id);
    refreshFlows();
  }

  function handleCancel() {
    setView('dashboard');
  }

  const editingFlow = editingFlowId
    ? flows.find(f => f.id === editingFlowId) ?? null
    : null;

  if (view === 'wizard') {
    return (
      <Wizard
        flow={editingFlow}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Dashboard
      flows={flows}
      onNew={handleNew}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
