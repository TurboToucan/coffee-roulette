import type { Participant, Pair, Round } from './types';

/**
 * Builds a set of previously paired ID combos (sorted so order doesn't matter).
 */
function buildPairHistory(rounds: Round[]): Set<string> {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const pair of round.pairs) {
      const sorted = [...pair].sort();
      // For each combination of 2 in a group, mark as paired
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          seen.add(`${sorted[i]}|${sorted[j]}`);
        }
      }
    }
  }
  return seen;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Attempts to build a valid pairing using backtracking.
 * Returns an array of pairs/trios, or null if no valid pairing found.
 */
function backtrack(
  remaining: string[],
  history: Set<string>,
  result: Pair[],
  trioDone: boolean,
): Pair[] | null {
  if (remaining.length === 0) return result;

  // If exactly 1 left and no trio has been formed yet, we need to merge with last pair
  if (remaining.length === 1) {
    if (!trioDone && result.length > 0) {
      const lastPair = result[result.length - 1];
      const candidate = remaining[0];
      // Check candidate hasn't been paired with anyone in lastPair
      const alreadyPaired = lastPair.some(
        (id) => history.has(pairKey(id, candidate))
      );
      if (!alreadyPaired) {
        const newResult = [...result.slice(0, -1), [...lastPair, candidate] as Pair];
        return newResult;
      }
    }
    return null; // can't resolve odd one out
  }

  const [first, ...rest] = remaining;

  // Try pairing `first` with each other person
  for (let i = 0; i < rest.length; i++) {
    const partner = rest[i];
    if (!history.has(pairKey(first, partner))) {
      const newRemaining = rest.filter((_, idx) => idx !== i);
      const outcome = backtrack(
        newRemaining,
        history,
        [...result, [first, partner]],
        trioDone,
      );
      if (outcome) return outcome;
    }
  }

  // If odd number and no trio yet, try forming a trio with `first` + two others
  if (!trioDone && remaining.length >= 3) {
    for (let i = 0; i < rest.length; i++) {
      for (let j = i + 1; j < rest.length; j++) {
        const p1 = rest[i];
        const p2 = rest[j];
        if (
          !history.has(pairKey(first, p1)) &&
          !history.has(pairKey(first, p2)) &&
          !history.has(pairKey(p1, p2))
        ) {
          const newRemaining = rest.filter((_, idx) => idx !== i && idx !== j);
          const outcome = backtrack(
            newRemaining,
            history,
            [...result, [first, p1, p2]],
            true,
          );
          if (outcome) return outcome;
        }
      }
    }
  }

  return null;
}

/**
 * Generates pairings for active participants, avoiding past pairs where possible.
 * Tries multiple shuffles to find a valid no-repeat solution.
 * Falls back to allowing minimum repeats if truly unavoidable.
 */
export function generatePairings(
  participants: Participant[],
  rounds: Round[],
): Pair[] {
  const active = participants.filter((p) => p.active);
  if (active.length < 2) return [];

  const history = buildPairHistory(rounds);
  const ids = active.map((p) => p.id);

  // Try up to 200 random shuffles to find a valid pairing
  for (let attempt = 0; attempt < 200; attempt++) {
    const shuffled = shuffle(ids);
    const result = backtrack(shuffled, history, [], ids.length % 2 === 0);
    if (result) return result;
  }

  // Fallback: relax history constraint — allow repeats, minimize them
  // Score a pairing by number of repeated pairs (lower is better)
  let bestResult: Pair[] = [];
  let bestScore = Infinity;

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = shuffle(ids);
    const result = backtrack(shuffled, new Set(), [], ids.length % 2 !== 0);
    if (!result) continue;
    const score = result.reduce((acc, pair) => {
      for (let i = 0; i < pair.length; i++) {
        for (let j = i + 1; j < pair.length; j++) {
          if (history.has(pairKey(pair[i], pair[j]))) acc++;
        }
      }
      return acc;
    }, 0);
    if (score < bestScore) {
      bestScore = score;
      bestResult = result;
    }
    if (bestScore === 0) break;
  }

  return bestResult;
}

/**
 * Returns participant names for display given a pair of IDs.
 */
export function pairToNames(
  pair: Pair,
  participants: Participant[],
  snapshot?: Record<string, string>,
): string[] {
  return pair.map(
    (id) => participants.find((p) => p.id === id)?.name ?? snapshot?.[id] ?? id,
  );
}
