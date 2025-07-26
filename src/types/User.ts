import { ActivityType, Entry } from ".";

export interface User {
  userId: number;
  entries: Entry[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipos para estadísticas
export interface UserStats {
  totalEntries: number;
  thisMonth: number;
  lastActivity?: Date;
  averageSatisfaction?: number;
  mostCommonActivity?: ActivityType;
}