// src/store/entriesSlice.ts

import { v4 as uuidv4 } from 'uuid';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entry, CreateEntryInput, EntryFilters, UserStats } from '@shared/types';

interface EntriesState {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  filters: EntryFilters;
  stats: UserStats;
}

const initialState: EntriesState = {
  entries: [],
  loading: false,
  error: null,
  filters: {},
  stats: {
    totalEntries: 0,
    thisMonth: 0,
  }
};

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    // Cargar entradas desde almacenamiento local
    loadEntries: (state, action: PayloadAction<Entry[]>) => {
      state.entries = action.payload;
      state.stats = calculateStats(action.payload);
    },

    // Agregar nueva entrada
    addEntry: (state, action: PayloadAction<CreateEntryInput>) => {
      const newEntry: Entry = {
        id: generateId(),
        ...action.payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      state.entries.unshift(newEntry); // Agregar al inicio (más recientes primero)
      state.stats = calculateStats(state.entries);
    },

    // Actualizar entrada existente
    updateEntry: (state, action: PayloadAction<Entry>) => {
      const index = state.entries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...action.payload,
          updatedAt: new Date(),
        };
        state.stats = calculateStats(state.entries);
      }
    },

    // Eliminar entrada
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(entry => entry.id !== action.payload);
      state.stats = calculateStats(state.entries);
    },

    // Configurar filtros
    setFilters: (state, action: PayloadAction<EntryFilters>) => {
      state.filters = action.payload;
    },

    // Limpiar filtros
    clearFilters: (state) => {
      state.filters = {};
    },

    // Estados de carga
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Función auxiliar para generar IDs únicos
const generateId = (): string => {
  return uuidv4();
};

// Función para calcular estadísticas
const calculateStats = (entries: Entry[]): UserStats => {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      thisMonth: 0,
    };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const entriesWithSatisfaction = entries.filter(entry => entry.satisfaction !== undefined);
  const averageSatisfaction = entriesWithSatisfaction.length > 0
    ? entriesWithSatisfaction.reduce((sum, entry) => sum + (entry.satisfaction || 0), 0) / entriesWithSatisfaction.length
    : undefined;

  // Encontrar actividad más común
  const activityCounts: { [key: string]: { count: number; activity: any } } = {};
  entries.forEach(entry => {
    const activityId = entry.activityType.id;
    if (activityCounts[activityId]) {
      activityCounts[activityId].count++;
    } else {
      activityCounts[activityId] = { count: 1, activity: entry.activityType };
    }
  });

  const mostCommonActivity = Object.values(activityCounts).reduce((max, current) => 
    current.count > max.count ? current : max, 
    { count: 0, activity: undefined }
  ).activity;

  return {
    totalEntries: entries.length,
    thisMonth: thisMonthEntries.length,
    lastActivity: entries.length > 0 ? new Date(entries[0].date) : undefined,
    averageSatisfaction,
    mostCommonActivity,
  };
};

export const {
  loadEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  setFilters,
  clearFilters,
  setLoading,
  setError,
} = entriesSlice.actions;

export default entriesSlice.reducer;