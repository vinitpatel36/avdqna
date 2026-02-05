
export enum Role {
  HOST = 'HOST',
  PARTICIPANT = 'PARTICIPANT',
  DISPLAY = 'DISPLAY'
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  RESULTS = 'RESULTS'
}

export interface Participant {
  id: string;
  name: string;
  answer: string;
  isSubmitted: boolean;
}

export interface HistoryItem {
  question: string;
  participants: Participant[];
}

export interface GameState {
  status: GameStatus;
  question: string;
  questionQueue: string[];
  questionHistory: HistoryItem[];
  participants: Participant[];
}

export interface ChannelMessage {
  type: 'UPDATE_STATE' | 'PING';
  state: GameState;
}
