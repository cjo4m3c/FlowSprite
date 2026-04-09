import DiagramRenderer from './DiagramRenderer.jsx';
import FlowTable from './FlowTable.jsx';

export default function FlowViewer({ flow, onBack, onEdit, onSave }) {
  if (!flow) return null;
  return (
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      <header className="px-6 py-3 shadow-md flex items-center gap-4" style={{ background: '#4A5240', color: 'white' }}>
        <button onClick={onBack} className="opacity-70 hover:opacity-100 text-sm">← 返回</button>
        <span className="text-lg font-bold tracking-wide">
          {flow.l3Number}　{flow.l3Name}
        </span>
        <button onClick={onEdit}
          className="ml-auto px-4 py-1.5 text-sm rounded border border-white border-opacity-50 text-white hover:bg-white hover:bg-opacity-10 transition-colors">
          編輯
        </button>
      </header>

      <main className="px-4 py-6 w-full max-w-full">
        <DiagramRenderer flow={flow} showExport={true} />
        <FlowTable flow={flow} onSave={onSave} />
      </main>
    </div>
  );
}
