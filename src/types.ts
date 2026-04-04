export interface Participant {
  id: string;
  name: string;
  active: boolean; // false = paused for this round and future rounds until re-enabled
  joinedRound: number; // round number they first joined
}

export type Pair = [string, string] | [string, string, string]; // participant IDs

export interface Round {
  id: number;
  date: string; // ISO date string
  pairs: Pair[];
  participantIds: string[]; // who was active in this round
}

export interface AppState {
  participants: Participant[];
  rounds: Round[];
}
