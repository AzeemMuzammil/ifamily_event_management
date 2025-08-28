export type PlayerCategory = 'kids' | 'elders' | 'adult_men' | 'adult_women';

export type EventType = 'individual' | 'group';

export type EventStatus = 'scheduled' | 'in-progress' | 'completed';

export interface CategoryScores {
  kids: number;
  elders: number;
  adult_men: number;
  adult_women: number;
}

export interface House {
  id: string;
  name: string;
  totalScore: number;
  categoryScores: CategoryScores;
}

export interface Player {
  id: string;
  name: string;
  houseId: string;
  category: PlayerCategory;
  individualScore: number;
  categoryScore: number;
}

export interface EventScoring {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
}

export interface BaseEvent {
  id: string;
  name: string;
  type: EventType;
  categories: PlayerCategory[];
  scoring: EventScoring;
  createdAt: Date;
}

export interface EventResult {
  position: number;
  playerId?: string;
  houseId?: string;
  playerName?: string;
  houseName?: string;
  category: PlayerCategory;
}

export interface EventWinner {
  id: string;
  name: string;
}

export interface EventInstance {
  id: string;
  baseEventId: string;
  baseEventName: string;
  eventName: string;
  type: EventType;
  category: PlayerCategory;
  status: EventStatus;
  scoring: EventScoring;
  startTime?: Date;
  endTime?: Date;
  results: EventResult[];
  winners?: EventWinner[];
}

export interface SpecialAward {
  id: string;
  eventInstanceId: string;
  eventName: string;
  category: string;
  winnerName: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  position: number;
  name: string;
  score: number;
  houseId?: string;
  houseName?: string;
  category?: PlayerCategory;
}

export interface AuthState {
  isAuthenticated: boolean;
}

export interface DashboardData {
  houses: House[];
  players: Player[];
  recentEvents: EventInstance[];
  upcomingEvents: EventInstance[];
}