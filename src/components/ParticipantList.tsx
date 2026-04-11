import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Pause, Play, Trash2, Check, X } from 'lucide-react';
import type { Participant } from '../types';

interface Props {
  participants: Participant[];
  onAdd: (name: string) => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function ParticipantList({ participants, onAdd, onToggleActive, onRemove, onRename }: Props) {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditValue(p.name);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    onAdd(name);
    setInput('');
  };

  const activeCount = participants.filter((p) => p.active).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800">
          Participants
        </h2>
        <span className="text-sm text-stone-500">
          {activeCount} active · {participants.length} total
        </span>
      </div>

      {/* Add participant */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a name..."
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <UserPlus size={15} />
          Add
        </button>
      </div>

      {/* List */}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {participants.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                p.active
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              {editingId === p.id ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  onBlur={commitEdit}
                  className="flex-1 text-sm font-medium px-1 py-0.5 rounded border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
              ) : (
                <span
                  onClick={() => startEdit(p)}
                  title="Click to rename"
                  className={`text-sm font-medium cursor-text hover:text-amber-600 hover:bg-amber-100 px-1 rounded-md transition-colors ${p.active ? 'text-stone-800' : 'text-stone-500 line-through'}`}
                >
                  {p.name}
                </span>
              )}
              <div className="flex items-center gap-1">
                {editingId === p.id ? (
                  <>
                    <button onClick={commitEdit} title="Save" className="p-1.5 rounded-md text-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} title="Cancel" className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 transition-colors cursor-pointer">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onToggleActive(p.id)}
                      title={p.active ? 'Pause participant' : 'Resume participant'}
                      className="p-1.5 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      {p.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => onRemove(p.id)}
                      title="Remove participant"
                      className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>

        {participants.length === 0 && (
          <li className="text-center text-stone-400 text-sm py-6">
            No participants yet. Add some above!
          </li>
        )}
      </ul>
    </div>
  );
}
