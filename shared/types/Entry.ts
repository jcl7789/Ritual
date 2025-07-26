import { Types } from "mongoose";

/**
 * Define las categorías de actividad.
 */
export enum ActivityCategory {
  SOLO = 'solo',
  PARTNER = 'partner',
  OTHER = 'other'
}

/**
 * Define los tipos de actividad sexual que pueden ser registrados.
 */
export interface ActivityType {
  id: string;
  key: string;
  icon: string;
  category: ActivityCategory;
}

/**
 * Representa una entrada de actividad sexual registrada por un usuario.
 */
export interface Entry extends InternalEntry {
  id?: string;
}

export interface InternalEntry {
  date: Date;     // Fecha y hora de la actividad
  activityType: ActivityType; // Tipo de actividad realizada (objeto ActivityType)
  partner?: string; // Nombre del compañero/a (opcional)
  duration?: number; // Duración en minutos (opcional)
  satisfaction?: number; // Escala de satisfacción 1-5 (opcional)
  notes?: string; // Notas opcionales sobre la sesión
  createdAt: Date; // Fecha de creación de la entrada
  updatedAt: Date; // Fecha de última actualización de la entrada
}

/**
 * Extiende la interfaz Entry con los métodos de subdocumento de Mongoose.
 * Esto es necesario para que TypeScript reconozca métodos como `toObject()` en las entradas recuperadas.
 */
export interface EntrySubdocument extends InternalEntry, Types.Subdocument {}



// Tipos para el formulario de nueva entrada
export interface CreateEntryInput {
  date: Date;
  activityType: ActivityType;
  partner?: string;
  duration?: number;
  satisfaction?: number;
  notes?: string;
}



// Tipos para filtros
export interface EntryFilters {
  startDate?: Date;
  endDate?: Date;
  activityTypes?: string[]; // IDs de ActivityType
  minSatisfaction?: number;
  partner?: string;
}

// Actividades predefinidas comunes
export const DEFAULT_ACTIVITIES: ActivityType[] = [
  {
    id: '1',
    key: 'sexual_intercourse', // Cambiado a key
    icon: '❤️',
    category: ActivityCategory.PARTNER
  },
  {
    id: '2',
    key: 'foreplay', // Cambiado a key
    icon: '🔥',
    category: ActivityCategory.PARTNER
  },
  {
    id: '3',
    key: 'masturbation', // Cambiado a key
    icon: '🤍',
    category: ActivityCategory.SOLO
  },
  {
    id: '4',
    key: 'oral_sex', // Cambiado a key
    icon: '💋',
    category: ActivityCategory.PARTNER
  },
  {
    id: '5',
    key: 'anal_sex', // Cambiado a key
    icon: '🍑',
    category: ActivityCategory.PARTNER
  },
  {
    id: '6',
    key: 'other', // Cambiado a key
    icon: '✨',
    category: ActivityCategory.OTHER
  }
];