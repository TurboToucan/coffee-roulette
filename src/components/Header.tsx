import { Download, Upload } from 'lucide-react';
import type { AppState } from '../types';
import { exportToJson, importFromJson } from '../storage';
import { useRef } from 'react';

interface Props {
  state: AppState;
  onImport: (state: AppState) => void;
}

export default function Header({ state, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJson(file);
      onImport(imported);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-2xl">☕</span>
        <div>
          <h1 className="text-lg font-bold text-stone-800 leading-tight">Coffee Roulette</h1>
          <p className="text-xs text-stone-400">Random coffee pairings for your community</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          title="Import session from JSON"
        >
          <Upload size={15} />
          Import
        </button>
        <button
          onClick={() => exportToJson(state)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          title="Export session to JSON"
        >
          <Download size={15} />
          Export
        </button>
      </div>
    </header>
  );
}
