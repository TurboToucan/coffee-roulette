import { describe, it, expect } from 'vitest'
import { generatePairings, pairToNames } from './algorithm'
import type { Participant, Round, Pair } from './types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Participant array from a list of names.
 * IDs are deterministic ("id-0", "id-1", ...) so tests can reason about them.
 */
function makeParticipants(names: string[], active = true): Participant[] {
  return names.map((name, i) => ({
    id: `id-${i}`,
    name,
    active,
    joinedRound: 1,
  }))
}

/**
 * Builds a Round from an explicit list of ID pairs/trios.
 * Keeps test setup concise — we only care about the pairs for history purposes.
 */
function makeRound(pairs: Pair[], id = 1): Round {
  return {
    id,
    date: new Date().toISOString(),
    pairs,
    participantIds: [],
    participantSnapshot: {},
  }
}

/**
 * Returns a flat list of all IDs that appear in a set of pairings.
 */
function allIdsInPairings(pairs: Pair[]): string[] {
  return pairs.flat()
}

/**
 * Returns every 2-person combination within a pair/trio as "id-a|id-b" strings.
 * Used to check for repeat pairings.
 */
function pairingCombos(pairs: Pair[]): string[] {
  const combos: string[] = []
  for (const pair of pairs) {
    for (let i = 0; i < pair.length; i++) {
      for (let j = i + 1; j < pair.length; j++) {
        combos.push([pair[i], pair[j]].sort().join('|'))
      }
    }
  }
  return combos
}

// ---------------------------------------------------------------------------
// generatePairings
// ---------------------------------------------------------------------------

describe('generatePairings', () => {

  // --- Basic structure ---

  it('returns an empty array when fewer than 2 active participants', () => {
    expect(generatePairings(makeParticipants([]), [])).toEqual([])
    expect(generatePairings(makeParticipants(['Alice']), [])).toEqual([])
  })

  it('pairs two participants together', () => {
    const participants = makeParticipants(['Alice', 'Bob'])
    const result = generatePairings(participants, [])

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(2)
    // Both participants must appear
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-1'])
  })

  it('forms a single trio for 3 participants', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Carol'])
    const result = generatePairings(participants, [])

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(3)
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-1', 'id-2'])
  })

  it('produces 2 pairs for 4 participants', () => {
    const participants = makeParticipants(['Alice', 'Bob', 'Carol', 'Dave'])
    const result = generatePairings(participants, [])

    expect(result).toHaveLength(2)
    // Every participant appears exactly once
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-1', 'id-2', 'id-3'])
    // All groups are pairs (no trios)
    result.forEach(pair => expect(pair).toHaveLength(2))
  })

  it('produces one trio and the rest pairs for 5 participants', () => {
    const participants = makeParticipants(['A', 'B', 'C', 'D', 'E'])
    const result = generatePairings(participants, [])

    // 5 people → 1 trio + 1 pair = 2 groups
    expect(result).toHaveLength(2)
    // Everyone appears exactly once
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-1', 'id-2', 'id-3', 'id-4'])
    // Exactly one group has 3 members
    const trioCount = result.filter(p => p.length === 3).length
    expect(trioCount).toBe(1)
  })

  it('covers all participants for larger even groups', () => {
    const participants = makeParticipants(['A', 'B', 'C', 'D', 'E', 'F'])
    const result = generatePairings(participants, [])

    expect(result).toHaveLength(3)
    expect(allIdsInPairings(result).sort()).toEqual(
      ['id-0', 'id-1', 'id-2', 'id-3', 'id-4', 'id-5']
    )
    result.forEach(pair => expect(pair).toHaveLength(2))
  })

  // --- Inactive participants ---

  it('excludes paused (inactive) participants from pairings', () => {
    const participants: Participant[] = [
      { id: 'id-0', name: 'Alice', active: true,  joinedRound: 1 },
      { id: 'id-1', name: 'Bob',   active: false, joinedRound: 1 }, // paused
      { id: 'id-2', name: 'Carol', active: true,  joinedRound: 1 },
    ]
    const result = generatePairings(participants, [])

    expect(result).toHaveLength(1)
    expect(allIdsInPairings(result)).not.toContain('id-1')
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-2'])
  })

  it('returns empty when all participants are paused', () => {
    const participants = makeParticipants(['Alice', 'Bob'], false)
    expect(generatePairings(participants, [])).toEqual([])
  })

  it('returns empty when only one participant is active', () => {
    const participants: Participant[] = [
      { id: 'id-0', name: 'Alice', active: true,  joinedRound: 1 },
      { id: 'id-1', name: 'Bob',   active: false, joinedRound: 1 },
    ]
    expect(generatePairings(participants, [])).toEqual([])
  })

  // --- History avoidance ---

  it('avoids repeating a previous pairing', () => {
    const participants = makeParticipants(['A', 'B', 'C', 'D'])
    // Round 1: id-0 & id-1 were paired, id-2 & id-3 were paired
    const history = [makeRound([['id-0', 'id-1'], ['id-2', 'id-3']])]

    const result = generatePairings(participants, history)
    const combos = pairingCombos(result)

    expect(combos).not.toContain('id-0|id-1')
    expect(combos).not.toContain('id-2|id-3')
  })

  it('avoids all pairs from multiple rounds of history', () => {
    // 4 participants cycling through pairings
    // Round 1: 0-1, 2-3
    // Round 2: 0-2, 1-3
    // Round 3 should produce: 0-3, 1-2
    const participants = makeParticipants(['A', 'B', 'C', 'D'])
    const history = [
      makeRound([['id-0', 'id-1'], ['id-2', 'id-3']], 1),
      makeRound([['id-0', 'id-2'], ['id-1', 'id-3']], 2),
    ]
    const result = generatePairings(participants, history)
    const combos = pairingCombos(result)

    expect(combos).not.toContain('id-0|id-1')
    expect(combos).not.toContain('id-2|id-3')
    expect(combos).not.toContain('id-0|id-2')
    expect(combos).not.toContain('id-1|id-3')
  })

  it('counts members within historical trios as paired with each other', () => {
    // 7 people: round 1 had trio [0,1,2] + pairs [3,4] and [5,6]
    // All three combinations within the trio (0|1, 0|2, 1|2) should be avoided
    // in round 2. With 7 people there are plenty of fresh combos available.
    const participants = makeParticipants(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    const history = [makeRound([
      ['id-0', 'id-1', 'id-2'],
      ['id-3', 'id-4'],
      ['id-5', 'id-6'],
    ])]

    const result = generatePairings(participants, history)
    const combos = pairingCombos(result)

    expect(combos).not.toContain('id-0|id-1')
    expect(combos).not.toContain('id-0|id-2')
    expect(combos).not.toContain('id-1|id-2')
  })

  // --- Early trio (the scenario that requires the EARLY TRIO block) ---
  //
  // History: {0-3, 0-4, 1-3, 1-4, 2-3, 2-4}
  // (ids 0,1,2 have each met ids 3,4)
  // The ONLY valid solution is trio [0,1,2] + pair [3,4].
  // This can only be found via the EARLY TRIO block in backtrack().

  it('finds the early-trio solution when pairing is otherwise impossible', () => {
    const participants = makeParticipants(['A', 'B', 'C', 'D', 'E'])
    const history = [makeRound([
      ['id-0', 'id-3'],
      ['id-1', 'id-4'],
      ['id-2', 'id-3'], // id-3 was in two rounds; that's fine for this test
    ]), makeRound([
      ['id-0', 'id-4'],
      ['id-1', 'id-3'],
      ['id-2', 'id-4'],
    ])]
    // Now: 0-3, 0-4, 1-3, 1-4, 2-3, 2-4 all used → only valid solution is [0,1,2] + [3,4]

    const result = generatePairings(participants, history)
    expect(result).toHaveLength(2)

    const trio = result.find(p => p.length === 3)
    const pair = result.find(p => p.length === 2)

    expect(trio).toBeDefined()
    expect(pair).toBeDefined()
    // The trio must be [id-0, id-1, id-2] and pair must be [id-3, id-4]
    expect([...trio!].sort()).toEqual(['id-0', 'id-1', 'id-2'])
    expect([...pair!].sort()).toEqual(['id-3', 'id-4'])
  })

  // --- Fallback (history exhausted) ---

  it('still returns a valid pairing when history is fully exhausted', () => {
    // Only 2 people who have already met — a repeat is unavoidable
    const participants = makeParticipants(['Alice', 'Bob'])
    const history = [makeRound([['id-0', 'id-1']])]

    const result = generatePairings(participants, history)

    // Should still return a pair rather than giving up
    expect(result).toHaveLength(1)
    expect(allIdsInPairings(result).sort()).toEqual(['id-0', 'id-1'])
  })

})

// ---------------------------------------------------------------------------
// pairToNames
// ---------------------------------------------------------------------------

describe('pairToNames', () => {

  const participants = makeParticipants(['Alice', 'Bob', 'Carol'])

  it('resolves IDs to names for a pair', () => {
    const result = pairToNames(['id-0', 'id-1'], participants)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('resolves IDs to names for a trio', () => {
    const result = pairToNames(['id-0', 'id-1', 'id-2'], participants)
    expect(result).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('falls back to snapshot name when participant has been deleted', () => {
    const snapshot = { 'id-99': 'DeletedPerson' }
    const result = pairToNames(['id-0', 'id-99'], participants, snapshot)
    expect(result).toEqual(['Alice', 'DeletedPerson'])
  })

  it('falls back to raw ID when not in participants or snapshot', () => {
    const result = pairToNames(['id-0', 'id-unknown'], participants)
    expect(result).toEqual(['Alice', 'id-unknown'])
  })

})
