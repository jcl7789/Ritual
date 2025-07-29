import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ValidationService } from '../../services/validation/ValidationService';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime?: string; // HH:MM format
  frequency: 'daily' | 'weekly' | 'never';
  sound: boolean;
  vibration: boolean;
}

export interface PrivacySettings {
  requireAuth: boolean;
  authMethod: 'biometric' | 'pin' | 'pattern' | 'none';
  autoLock: boolean;
  autoLockTimeout: number; // seconds
  hideInRecents: boolean;
  privateMode: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
}

export interface AppSettings {
  language: 'en' | 'es';
  theme: ThemeSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  firstLaunch: boolean;
  onboardingCompleted: boolean;
  analyticsEnabled: boolean;
}

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const defaultSettings: AppSettings = {
  language: 'en',
  theme: {
    mode: 'auto',
    primaryColor: '#6366f1',
    accentColor: '#ec4899'
  },
  notifications: {
    enabled: false,
    frequency: 'never',
    sound: true,
    vibration: true
  },
  privacy: {
    requireAuth: false,
    authMethod: 'biometric',
    autoLock: false,
    autoLockTimeout: 300, // 5 minutes
    hideInRecents: true,
    privateMode: false
  },
  firstLaunch: true,
  onboardingCompleted: false,
  analyticsEnabled: false
};

const initialState: SettingsState = {
  settings: defaultSettings,
  loading: false,
  error: null,
  initialized: false
};

// Async Thunks
export const initializeSettings = createAsyncThunk(
  'settings/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const settingsString = await AsyncStorage.getItem('app_settings');
      if (settingsString) {
        const savedSettings = JSON.parse(settingsString);

        // Validar configuraciones cargadas
        const validation = await ValidationService.validateUserSettings(savedSettings);
        if (validation.isValid && validation.data) {
          return { ...defaultSettings, ...validation.data };
        }
      }

      // Si no hay configuraciones guardadas o son inválidas, usar por defecto
      await AsyncStorage.setItem('app_settings', JSON.stringify(defaultSettings));
      return defaultSettings;

    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize settings');
    }
  }
);

export const updateLanguage = createAsyncThunk(
  'settings/updateLanguage',
  async (language: 'en' | 'es', { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedSettings = {
        ...state.settings.settings,
        language
      };

      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      return language;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update language');
    }
  }
);

export const updateTheme = createAsyncThunk(
  'settings/updateTheme',
  async (theme: Partial<ThemeSettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedTheme = {
        ...state.settings.settings.theme,
        ...theme
      };
      const updatedSettings = {
        ...state.settings.settings,
        theme: updatedTheme
      };

      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      return updatedTheme;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update theme');
    }
  }
);

export const updateNotifications = createAsyncThunk(
  'settings/updateNotifications',
  async (notifications: Partial<NotificationSettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedNotifications = {
        ...state.settings.settings.notifications,
        ...notifications
      };
      const updatedSettings = {
        ...state.settings.settings,
        notifications: updatedNotifications
      };

      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      return updatedNotifications;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update notifications');
    }
  }
);

export const updatePrivacy = createAsyncThunk(
  'settings/updatePrivacy',
  async (privacy: Partial<PrivacySettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedPrivacy = {
        ...state.settings.settings.privacy,
        ...privacy
      };
      const updatedSettings = {
        ...state.settings.settings,
        privacy: updatedPrivacy
      };

      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      return updatedPrivacy;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update privacy settings');
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'settings/completeOnboarding',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedSettings = {
        ...state.settings.settings,
        firstLaunch: false,
        initialized: true,
        onboardingCompleted: true
      };

      await AsyncStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to complete onboarding');
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/reset',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to reset settings');
    }
  }
);

export const exportSettings = createAsyncThunk(
  'settings/export',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const settingsData = {
        settings: state.settings.settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(settingsData, null, 2);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export settings');
    }
  }
);

export const importSettings = createAsyncThunk(
  'settings/import',
  async (settingsData: string, { rejectWithValue }) => {
    try {
      const parsedData = JSON.parse(settingsData);

      // Validar estructura de configuraciones importadas
      if (!parsedData.settings) {
        throw new Error('Invalid settings format');
      }

      const validation = await ValidationService.validateUserSettings(parsedData.settings);
      if (!validation.isValid) {
        throw new Error('Invalid settings data');
      }

      const mergedSettings = { ...defaultSettings, ...validation.data };
      await AsyncStorage.setItem('app_settings', JSON.stringify(mergedSettings));

      return mergedSettings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Sincronizar configuraciones inmediatamente sin persistencia
    setLanguage: (state, action: PayloadAction<'en' | 'es'>) => {
      state.settings.language = action.payload;
    },

    setThemeMode: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.settings.theme.mode = action.payload;
    },

    togglePrivateMode: (state) => {
      state.settings.privacy.privateMode = !state.settings.privacy.privateMode;
    },

    setAutoLock: (state, action: PayloadAction<boolean>) => {
      state.settings.privacy.autoLock = action.payload;
    },

    setAnalytics: (state, action: PayloadAction<boolean>) => {
      state.settings.analyticsEnabled = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Para desarrollo/testing
    resetToDefaults: (state) => {
      state.settings = defaultSettings;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Settings
      .addCase(initializeSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload as AppSettings;
        state.initialized = true;
      })
      .addCase(initializeSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
      })

      // Update Language
      .addCase(updateLanguage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.language = action.payload;
      })
      .addCase(updateLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Theme
      .addCase(updateTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.theme = action.payload;
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Notifications
      .addCase(updateNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.notifications = action.payload;
      })
      .addCase(updateNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Privacy
      .addCase(updatePrivacy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrivacy.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.privacy = action.payload;
      })
      .addCase(updatePrivacy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Complete Onboarding
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.loading = false;
        state.settings.firstLaunch = false;
        state.settings.onboardingCompleted = true;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Reset Settings
      .addCase(resetSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Export Settings
      .addCase(exportSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportSettings.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Import Settings
      .addCase(importSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload as AppSettings;
      })
      .addCase(importSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectores
export const selectSettings = (state: { settings: SettingsState }) => state.settings.settings;
export const selectTheme = (state: { settings: SettingsState }) => state.settings.settings.theme;
export const selectLanguage = (state: { settings: SettingsState }) => state.settings.settings.language;
export const selectNotifications = (state: { settings: SettingsState }) => state.settings.settings.notifications;
export const selectPrivacy = (state: { settings: SettingsState }) => state.settings.settings.privacy;
export const selectIsFirstLaunch = (state: { settings: SettingsState }) => state.settings.settings.firstLaunch;
export const selectIsOnboardingCompleted = (state: { settings: SettingsState }) => state.settings.settings.onboardingCompleted;
export const selectSettingsLoading = (state: { settings: SettingsState }) => state.settings.loading;
export const selectSettingsError = (state: { settings: SettingsState }) => state.settings.error;
export const selectSettingsInitialized = (state: { settings: SettingsState }) => state.settings.initialized;

export const {
  setLanguage,
  setThemeMode,
  togglePrivateMode,
  setAutoLock,
  setAnalytics,
  clearError,
  resetToDefaults
} = settingsSlice.actions;

export default settingsSlice.reducer;
