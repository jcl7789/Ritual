import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Entry, CreateEntryInput, UserStats } from '../../types';
import { User, UserProfile } from '../../types/User';
import { StorageService } from '../../services/storage/StorageService';



interface EntriesState {
  entries: Entry[];
  stats: UserStats;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  isFirstTime: boolean;
}

const initialState: EntriesState = {
  entries: [],
  stats: {
    totalEntries: 0,
    thisMonth: 0,
    averageSatisfaction: undefined,
    lastActivity: undefined,
    mostCommonActivity: undefined,
  },
  user: null,
  initialized: false,
  loading: false,
  error: null,
  isFirstTime: true,
};

// Async thunks
export const initializeApp = createAsyncThunk(
  'entries/initializeApp',
  async (_, { rejectWithValue }) => {
    try {
      // Verificar si es primera vez
      const hasExistingData = await StorageService.hasUserData();

      if (!hasExistingData) {
        return {
          isFirstTime: true,
          entries: [],
          stats: initialState.stats,
          userProfile: null,
        };
      }

      // Cargar datos existentes
      const [entries, stats, userRaw] = await Promise.all([
        StorageService.getEntries(),
        StorageService.getUserStats(),
        StorageService.getUserProfile(),
      ]);
      let user: User | null = null;
      if (userRaw) {
        user = {
          entries,
          createdAt: userRaw.createdAt,
          updatedAt: (userRaw as any).updatedAt ?? undefined,
          profile: userRaw.profile ?? {
            name: '',
            age: 0,
            partners: [], // Partner[] type
            actualPartner: 0,
            language: 'en',
          },
        };
      }
      return {
        isFirstTime: false,
        initialized: true,
        entries,
        stats,
        user,
      };
    } catch (error) {
      console.error('Error initializing app:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize app');
    }
  }
);

export const initializeUserProfile = createAsyncThunk(
  'entries/initializeUserProfile',
  async (profileData: Omit<UserProfile, 'createdAt'>, { rejectWithValue }) => {
    try {
      const userProfile: UserProfile = {
        ...profileData,
      };

      await StorageService.initializeUserProfile(userProfile);
      await StorageService.initializeStorage();
      const stats = await StorageService.getUserStats();
      const userRaw = await StorageService.getUserProfile();
      const entries = await StorageService.getEntries();
      let user: User;
      if (userRaw) {
        user = {
          entries,
          createdAt: userRaw.createdAt,
          updatedAt: (userRaw as any).updatedAt ?? undefined,
          profile: userRaw.profile ?? {
            name: '',
            age: 0,
            partners: [], // Partner[] type
            actualPartner: 0,
            language: 'en',
          },
        };
      } else {
        user = {
          entries: [],
          createdAt: new Date(),
          updatedAt: undefined,
          profile: {
            name: '',
            age: 0,
            partners: [], // Partner[] type
            actualPartner: 0,
            language: 'en',
            biometricEnabled: false, // Agregar campo por defecto
          },
        };
      }

      return {
        user,
        stats,
      };
    } catch (error) {
      console.error('Error initializing user profile:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize user profile');
    }
  }
);

export const addEntryAsync = createAsyncThunk(
  'entries/addEntry',
  async (entryData: CreateEntryInput, { rejectWithValue }) => {
    try {
      const newEntry = await StorageService.saveEntry(entryData);
      const updatedStats = await StorageService.getUserStats();

      return {
        entry: newEntry,
        stats: updatedStats,
      };
    } catch (error) {
      console.error('Error adding entry:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add entry');
    }
  }
);

export const deleteEntryAsync = createAsyncThunk(
  'entries/deleteEntry',
  async (entryId: string, { rejectWithValue }) => {
    try {
      await StorageService.deleteEntry(entryId);
      const updatedStats = await StorageService.getUserStats();

      return {
        entryId,
        stats: updatedStats,
      };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete entry');
    }
  }
);

export const loadEntriesAsync = createAsyncThunk(
  'entries/loadEntries',
  async (_, { rejectWithValue }) => {
    try {
      const [entries, stats] = await Promise.all([
        StorageService.getEntries(),
        StorageService.getUserStats(),
      ]);

      return {
        entries,
        stats,
      };
    } catch (error) {
      console.error('Error loading entries:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load entries');
    }
  }
);

export const createBackupAsync = createAsyncThunk(
  'entries/createBackup',
  async (_, { rejectWithValue }) => {
    try {
      const backupData = await StorageService.createBackup();
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
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
      console.error('Error exporting data:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export data');
    }
  }
);

export const importDataAsync = createAsyncThunk(
  'entries/importData',
  async (encryptedData: string, { rejectWithValue }) => {
    try {
      await StorageService.importData(encryptedData);
      // Recargar datos después de la importación
      const [entries, stats, userProfileRaw] = await Promise.all([
        StorageService.getEntries(),
        StorageService.getUserStats(),
        StorageService.getUserProfile(),
      ]);
      let user: User | null = null;
      if (userProfileRaw) {
        user = {
          entries,
          createdAt: userProfileRaw.createdAt,
          updatedAt: (userProfileRaw as any).updatedAt ?? undefined,
          profile: userProfileRaw.profile ?? {
            name: '',
            age: 0,
            partners: [], // Partner[] type
            actualPartner: 0,
            language: 'en',
          },
        };
      }
      return {
        entries,
        stats,
        user,
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import data');
    }
  }
);

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
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
        state.initialized = true;
        state.isFirstTime = action.payload.isFirstTime;
        state.entries = action.payload.entries;
        state.stats = action.payload.stats;
        state.user = action.payload.user ?? null;

      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Initialize User Profile
      .addCase(initializeUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? null;
        state.stats = action.payload.stats;
        state.isFirstTime = false;
        state.initialized = true;
      })
      .addCase(initializeUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add Entry
      .addCase(addEntryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEntryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload.entry); // Agregar al inicio
        state.stats = action.payload.stats;
      })
      .addCase(addEntryAsync.rejected, (state, action) => {
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
        state.entries = state.entries.filter(
          entry => entry.id !== action.payload.entryId
        );
        state.stats = action.payload.stats;
      })
      .addCase(deleteEntryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Load Entries
      .addCase(loadEntriesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadEntriesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.stats = action.payload.stats;
      })
      .addCase(loadEntriesAsync.rejected, (state, action) => {
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
        state.entries = action.payload.entries;
        state.stats = action.payload.stats;
        state.user = action.payload.user ?? null;
      })
      .addCase(importDataAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUserProfile } = entriesSlice.actions;
export default entriesSlice.reducer;