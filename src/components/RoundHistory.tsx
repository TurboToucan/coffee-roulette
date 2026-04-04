import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Round, Participant } from '../types';
import { pairToNames } from '../algorithm';

interface Props {
  rounds: Round[];
  participants: Participant[];
  onDeleteRound: (id: number) => void;
}

export default function RoundHistory({ rounds, participants, onDeleteRound }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(
    rounds.length > 0 ? rounds[rounds.length - 1].id : null
  );

  if (rounds.length === 0) return null;

  const sorted = [...rounds].sort((a, b) => b.id - a.id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Round History</h2>
      <div className="space-y-2">
        {sorted.map((round) => {
          const isOpen = expandedId === round.id;
          return (
            <div key={round.id} className="border border-stone-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : round.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-medium text-stone-700 text-sm">
                    Round {round.id}
                  </span>
                  <span className="text-stone-400 text-xs ml-3">
                    {new Date(round.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span className="text-stone-400 text-xs ml-2">
                    · {round.pairs.length} {round.pairs.length === 1 ? 'pair' : 'pairs'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete round ${round.id}? This cannot be undone.`)) {
                        onDeleteRound(round.id);
                      }
                    }}
                    className="p-1 text-stone-300 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete round"
                  >
                    <Trash2 size={13} />
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1.5 border-t border-stone-100">
                      {round.pairs.map((pair, idx) => {
                        const names = pairToNames(pair, participants, round.participantSnapshot);
                        const isTrio = names.length === 3;
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm text-stone-600 pt-1.5">
                            <span className="text-amber-400">☕</span>
                            <span>{names.join(' & ')}</span>
                            {isTrio && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">trio</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
