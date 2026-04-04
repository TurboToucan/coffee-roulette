import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Pause, Play, Trash2 } from 'lucide-react';
import type { Participant } from '../types';

interface Props {
  participants: Participant[];
  onAdd: (name: string) => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function ParticipantList({ participants, onAdd, onToggleActive, onRemove }: Props) {
  const [input, setInput] = useState('');

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
              <span className={`text-sm font-medium ${p.active ? 'text-stone-800' : 'text-stone-500 line-through'}`}>
                {p.name}
              </span>
              <div className="flex items-center gap-1">
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
