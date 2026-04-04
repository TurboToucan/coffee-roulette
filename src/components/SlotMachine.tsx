import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee } from 'lucide-react';
import type { Pair } from '../types';
import type { Participant } from '../types';
import { pairToNames } from '../algorithm';

interface Props {
  isSpinning: boolean;
  pairs: Pair[];
  participants: Participant[];
  onSpinComplete: () => void;
}

/** Cycles through random names during the spin animation */
function SlotReel({ finalName, spin }: { finalName: string; spin: boolean }) {
  const [displayed, setDisplayed] = useState(finalName);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!spin) {
      setDisplayed(finalName);
      return;
    }
    const fakeNames = ['Alex', 'Sam', 'Jordan', 'Riley', 'Morgan', 'Casey', 'Taylor', 'Drew', 'Jamie', 'Quinn'];
    let i = 0;
    intervalRef.current = setInterval(() => {
      setDisplayed(fakeNames[i % fakeNames.length]);
      i++;
    }, 80);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spin, finalName]);

  return (
    <motion.span
      key={spin ? 'spinning' : finalName}
      className="font-bold text-amber-700"
    >
      {displayed}
    </motion.span>
  );
}

export default function SlotMachine({ isSpinning, pairs, participants, onSpinComplete }: Props) {
  const [revealedPairs, setRevealedPairs] = useState<Pair[]>([]);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!isSpinning) return;

    setRevealedPairs([]);
    setSpinning(true);

    // Reveal each pair with a staggered delay after spin
    const spinDuration = 1800;
    const revealDelay = 350;

    const spinTimeout = setTimeout(() => {
      setSpinning(false);
      pairs.forEach((pair, idx) => {
        setTimeout(() => {
          setRevealedPairs((prev) => [...prev, pair]);
          if (idx === pairs.length - 1) {
            onSpinComplete();
          }
        }, idx * revealDelay);
      });
    }, spinDuration);

    return () => clearTimeout(spinTimeout);
  }, [isSpinning]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSpinning && revealedPairs.length === 0 && pairs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Coffee className="text-amber-500" size={20} />
        <h2 className="text-lg font-semibold text-stone-800">New Pairings</h2>
        {spinning && (
          <span className="ml-auto text-xs text-stone-400 animate-pulse">Brewing matches...</span>
        )}
      </div>

      {/* Spinning reel preview */}
      {spinning && (
        <div className="flex justify-center items-center gap-3 py-8 px-4 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 mb-4">
          <div className="text-2xl overflow-hidden h-8 flex items-center">
            <SlotReel finalName="???" spin={true} />
          </div>
          <span className="text-stone-400 text-lg">☕</span>
          <div className="text-2xl overflow-hidden h-8 flex items-center">
            <SlotReel finalName="???" spin={true} />
          </div>
        </div>
      )}

      {/* Revealed pairs */}
      <AnimatePresence>
        {revealedPairs.map((pair, idx) => {
          const names = pairToNames(pair, participants);
          const isTrio = names.length === 3;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="flex items-center justify-center gap-3 py-3 px-4 mb-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
            >
              {names.map((name, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="font-semibold text-stone-800">{name}</span>
                  {i < names.length - 1 && (
                    <span className="text-amber-400 text-lg">☕</span>
                  )}
                </span>
              ))}
              {isTrio && (
                <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">trio</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
