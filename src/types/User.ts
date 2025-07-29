import { ActivityType, Entry } from ".";

export interface User {
  entries: Entry[];
  createdAt?: Date;
  updatedAt?: Date;
  profile: UserProfile;
}

export interface UserProfile {
  name: string;
  age: number;
  partners?: Partner[];
  actualPartner?: number;
  biometricEnabled: boolean;
}

export interface Partner {
  id: string;
  name: string;
}

// Tipos para estadísticas
export interface UserStats {
  totalEntries: number;
  thisMonth: number;
  lastActivity?: Date;
  averageSatisfaction?: number;
  mostCommonActivity?: ActivityType;
}