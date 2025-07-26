// src/store/slices/entriesSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Entry, CreateEntryInput, EntryFilters } from '../../types/Entry';
import { UserStats } from '../../types/User';
import { StorageService } from '../../services/storage/StorageService';
import { generateUUID } from '../../utils/uuid';

interface EntriesState {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  filters: EntryFilters;
  stats: UserStats;
  initialized: boolean;
}

const initialState: EntriesState = {
  entries: [],
  loading: false,
  error: null,
  filters: {},
  stats: {
    totalEntries: 0,
    thisMonth: 0,
  },
  initialized: false,
};

// Async Thunks para manejar almacenamiento
export const initializeApp = createAsyncThunk(
  'entries/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const entries = await StorageService.getEntries();
      return entries;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize app');
    }
  }
);

export const addEntryAsync = createAsyncThunk(
  'entries/addEntry',
  async (entryInput: CreateEntryInput, { rejectWithValue }) => {
    try {
      const newEntry: Entry = {
        id: generateUUID(),
        ...entryInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await StorageService.saveEntry(newEntry);
      return newEntry;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add entry');
    }
  }
);

export const updateEntryAsync = createAsyncThunk(
  'entries/updateEntry',
  async (entry: Entry, { rejectWithValue }) => {
    try {
      const updatedEntry = {
        ...entry,
        updatedAt: new Date(),
      };
      
      await StorageService.saveEntry(updatedEntry);
      return updatedEntry;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update entry');
    }
  }
);

export const deleteEntryAsync = createAsyncThunk(
  'entries/deleteEntry',
  async (entryId: string, { rejectWithValue }) => {
    try {
      await StorageService.deleteEntry(entryId);
      return entryId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete entry');
    }
  }
);

export const createBackupAsync = createAsyncThunk(
  'entries/createBackup',
  async (_, { rejectWithValue }) => {
    try {
      await StorageService.createBackup();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create backup');
    }
  }
);

export const exportDataAsync = createAsyncThunk(
  'entries/exportData',
  async (_, { rejectWithValue }) => {
    try {
      const exportedData = await StorageService.exportData();
      return exportedData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export data');
    }
  }
);

export const importDataAsync = createAsyncThunk(
  'entries/importData',
  async (encryptedData: string, { rejectWithValue }) => {
    try {
      await StorageService.importData(encryptedData);
      const entries = await StorageService.getEntries();
      return entries;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import data');
    }
  }
);

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    // Configurar filtros
    setFilters: (state, action: PayloadAction<EntryFilters>) => {
      state.filters = action.payload;
    },

    // Limpiar filtros
    clearFilters: (state) => {
      state.filters = {};
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize App
      .addCase(initializeApp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.stats = calculateStats(action.payload);
        state.initialized = true;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
      })

      // Add Entry
      .addCase(addEntryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEntryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload);
        state.stats = calculateStats(state.entries);
      })
      .addCase(addEntryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Entry
      .addCase(updateEntryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEntryAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entries.findIndex((entry:Entry) => entry.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
          state.stats = calculateStats(state.entries);
        }
      })
      .addCase(updateEntryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Entry
      .addCase(deleteEntryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEntryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter((entry:Entry) => entry.id !== action.payload);
        state.stats = calculateStats(state.entries);
      })
      .addCase(deleteEntryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Backup
      .addCase(createBackupAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBackupAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createBackupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Export Data
      .addCase(exportDataAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportDataAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportDataAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Import Data
      .addCase(importDataAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importDataAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.stats = calculateStats(action.payload);
      })
      .addCase(importDataAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

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
  setFilters,
  clearFilters,
  clearError,
} = entriesSlice.actions;

export default entriesSlice.reducer;