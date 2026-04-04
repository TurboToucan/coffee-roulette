import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { AppState, Pair } from './types';
import { generatePairings } from './algorithm';
import { loadFromLocalStorage, saveToLocalStorage } from './storage';
import Header from './components/Header';
import ParticipantList from './components/ParticipantList';
import SlotMachine from './components/SlotMachine';
import RoundHistory from './components/RoundHistory';

const EMPTY_STATE: AppState = { participants: [], rounds: [] };

function newId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadFromLocalStorage() ?? EMPTY_STATE);
  const [pendingPairs, setPendingPairs] = useState<Pair[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDone, setSpinDone] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToLocalStorage(state);
  }, [state]);

  const showToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addParticipant = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          id: newId(),
          name,
          active: true,
          joinedRound: prev.rounds.length + 1,
        },
      ],
    }));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p
      ),
    }));
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
      // Keep rounds intact — removed participant names will show as their ID if missing
    }));
  }, []);

  const handleGeneratePairings = () => {
    const active = state.participants.filter((p) => p.active);
    if (active.length < 2) {
      showToast('Need at least 2 active participants', 'warning');
      return;
    }
    const pairs = generatePairings(state.participants, state.rounds);
    setPendingPairs(pairs);
    setSpinDone(false);
    setIsSpinning(true);
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setSpinDone(true);
  };

  const handleConfirmRound = () => {
    if (pendingPairs.length === 0) return;
    const snapshot: Record<string, string> = {};
    state.participants.forEach((p) => { snapshot[p.id] = p.name; });
    const newRound = {
      id: (state.rounds[state.rounds.length - 1]?.id ?? 0) + 1,
      date: new Date().toISOString(),
      pairs: pendingPairs,
      participantIds: state.participants.filter((p) => p.active).map((p) => p.id),
      participantSnapshot: snapshot,
    };
    setState((prev) => ({ ...prev, rounds: [...prev.rounds, newRound] }));
    setPendingPairs([]);
    setSpinDone(false);
    showToast(`Round ${newRound.id} saved!`);
  };

  const handleRegenerate = () => {
    setPendingPairs([]);
    setSpinDone(false);
    setTimeout(handleGeneratePairings, 50);
  };

  const handleDeleteRound = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      rounds: prev.rounds.filter((r) => r.id !== id),
    }));
  }, []);

  const handleImport = useCallback((imported: AppState) => {
    setState(imported);
    setPendingPairs([]);
    setSpinDone(false);
    showToast('Session imported successfully!');
  }, []);

  const activeCount = state.participants.filter((p) => p.active).length;
  const canGenerate = activeCount >= 2 && !isSpinning;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header state={state} onImport={handleImport} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Generate button */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={handleGeneratePairings}
            disabled={!canGenerate}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 disabled:text-stone-400 text-white font-semibold text-base rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Shuffle size={20} />
            {isSpinning ? 'Brewing...' : 'Create Pairings'}
          </motion.button>
          {activeCount < 2 && state.participants.length > 0 && (
            <p className="text-xs text-stone-400">Add at least 2 active participants to get started</p>
          )}
        </div>

        {/* Slot machine / results */}
        <AnimatePresence>
          {(isSpinning || pendingPairs.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <SlotMachine
                isSpinning={isSpinning}
                pairs={pendingPairs}
                participants={state.participants}
                onSpinComplete={handleSpinComplete}
              />

              {/* Confirm / regenerate actions */}
              {spinDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center gap-3 mt-4"
                >
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-stone-600 hover:text-stone-800 border border-stone-200 hover:border-stone-300 rounded-xl bg-white transition-colors cursor-pointer"
                  >
                    <Shuffle size={15} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleConfirmRound}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <CheckCircle size={15} />
                    Confirm &amp; Save Round
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-column layout for participants + history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParticipantList
            participants={state.participants}
            onAdd={addParticipant}
            onToggleActive={toggleActive}
            onRemove={removeParticipant}
          />
          <RoundHistory
            rounds={state.rounds}
            participants={state.participants}
            onDeleteRound={handleDeleteRound}
          />
        </div>
      </main>

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white ${
              toast.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
            }`}
          >
            {toast.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
