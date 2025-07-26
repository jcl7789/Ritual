export interface Entry {
  id: string;
  date: Date;
  activityType: ActivityType;
  partner?: string;
  duration?: number; // en minutos
  satisfaction?: number; // 1-5 escala
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityType {
  id: string;
  name: string;
  icon: string;
  category: ActivityCategory;
}

export enum ActivityCategory {
  SOLO = 'solo',
  PARTNER = 'partner',
  OTHER = 'other'
}

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
  activityTypes?: string[];
  minSatisfaction?: number;
  partner?: string;
}

// Actividades predefinidas comunes
export const DEFAULT_ACTIVITIES: ActivityType[] = [
  {
    id: '1',
    name: 'activities.sex', // Usar claves de traducción
    icon: '❤️',
    category: ActivityCategory.PARTNER
  },
  {
    id: '2',
    name: 'activities.masturbation',
    icon: '🤍',
    category: ActivityCategory.SOLO
  },
  {
    id: '3',
    name: 'activities.oral',
    icon: '💋',
    category: ActivityCategory.PARTNER
  },
  {
    id: '4',
    name: 'activities.anal',
    icon: '🍑',
    category: ActivityCategory.PARTNER
  },
  {
    id: '5',
    name: 'activities.foreplay',
    icon: '🔥',
    category: ActivityCategory.PARTNER
  },
  {
    id: '6',
    name: 'activities.other',
    icon: '✨',
    category: ActivityCategory.OTHER
  }
];