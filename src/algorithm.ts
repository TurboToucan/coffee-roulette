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
 *
 * Priority order:
 *
 * 1. BASE CASE — remaining is empty: we're done, return the result.
 *
 * 2. LATE TRIO (remaining.length === 1) — one person is left over.
 *    Try merging them into the most recently formed pair to make a trio.
 *    Only attempted if no trio has been formed yet (trioDone = false).
 *    If the merge would repeat a past pairing, return null and let the
 *    caller backtrack to a different earlier pairing.
 *
 * 3. PAIR FIRST — try pairing `first` with each other remaining person
 *    (skipping anyone they've already met). For each valid partner, recurse
 *    on the rest. If the recursion succeeds, bubble the result up. If it
 *    dead-ends, try the next partner (backtracking).
 *
 * 4. EARLY TRIO (only if all pairs failed AND no trio yet AND remaining is odd) —
 *    try placing `first` into a trio with two other people, none of whom have
 *    met each other or `first`. Only attempted for odd remaining counts because
 *    a trio with even remaining always leaves one person stranded (trioDone=true
 *    blocks the late-trio merge), making it an impossible dead end.
 *    This block is needed when `first` can be paired with some people but every
 *    such pairing causes a downstream dead-end, yet a trio involving `first`
 *    would leave the rest in a solvable state.
 *    Example: history {A-D, A-E, B-D, B-E, C-D, C-E} with 5 people —
 *    the only solution is trio [A,B,C] + pair [D,E], which requires this block.
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

  // If odd number of remaining participants and no trio yet, try forming a trio with `first` + two others
  if (!trioDone && remaining.length >= 3 && remaining.length % 2 !== 0) {
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
    const result = backtrack(shuffled, history, [], false);
    if (result) return result;
  }

  // Fallback: relax history constraint — allow repeats, minimize them
  // Score a pairing by number of repeated pairs (lower is better)
  let bestResult: Pair[] = [];
  let bestScore = Infinity;

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = shuffle(ids);
    const result = backtrack(shuffled, new Set(), [], false);
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
