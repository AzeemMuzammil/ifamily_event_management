// Basic types
export type EventType = 'individual' | 'group';
export type EventStatus = 'scheduled' | 'in-progress' | 'completed';

// New schema interfaces based on Firestore collections
export interface House {
  id: string;
  name: string;          // Human-friendly name (e.g., "Red Falcons")
  colorHex: string;      // Hex code for UI (e.g., "#E53935")
}

export interface Category {
  id: string;
  name: string;          // Machine-safe name (e.g., "adult-men")
  label: string;         // User-facing label (e.g., "Adult - Men")
}

export interface Player {
  id: string;
  fullName: string;      // Player's full name (e.g., "John Smith")
  categoryId: string;    // Reference to documentId in Category
  houseId: string;       // Reference to documentId in House
}

export interface EventResult {
  placement: number;     // Rank in event (1, 2, 3, ...)
  participantId: string; // playerId for individual, houseId for group events
}

export interface Event {
  id: string;
  name: string;          // Event name (e.g., "100m Sprint")
  categoryId: string;    // Reference to categories collection
  type: EventType;       // "individual" or "group"
  status: EventStatus;   // "scheduled", "in-progress", "completed"
  scoring: {             // Points for placements
    [placement: number]: number; // e.g., {1: 5, 2: 3, 3: 1}
  };
  startTime?: Date;      // When the event starts
  endTime?: Date;        // When the event ends
  results?: EventResult[]; // Only present when status = "completed"
}

// Auth types
export interface AuthState {
  isAuthenticated: boolean;
}
