import { ActivityType, Entry } from "./Entry";

/**
 * Representa un usuario y sus entradas de actividad sexual.
 */
export interface User {
  userId: number; // Identificador único del usuario
  entries: Entry[]; // Array de entradas de actividad sexual
  createdAt?: Date; // Fecha de creación del usuario
  updatedAt?: Date; // Fecha de última actualización del usuario
}

// Tipos para estadísticas
export interface UserStats {
  totalEntries: number;
  thisMonth: number;
  lastActivity?: Date;
  averageSatisfaction?: number;
  mostCommonActivity?: ActivityType;
}