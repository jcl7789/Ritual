import { configureStore } from '@reduxjs/toolkit';
import entriesReducer from './slices/entriesSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    entries: entriesReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas en la verificación de serialización para Date objects
        ignoredActions: [
          'entries/addEntryAsync/fulfilled',
          'entries/updateEntryAsync/fulfilled',
          'entries/initializeApp/fulfilled',
          'entries/importDataAsync/fulfilled',
          'settings/initializeSettings/fulfilled',
          'settings/updateLanguage/fulfilled',
          'settings/updateTheme/fulfilled',
          'settings/updateNotifications/fulfilled',
          'settings/updatePrivacy/fulfilled',
          'settings/updateDataSettings/fulfilled',
          'settings/completeOnboarding/fulfilled',
          'settings/resetSettings/fulfilled',
          'settings/importSettings/fulfilled'
        ],
        ignoredPaths: [
          'entries.entries.date',
          'entries.entries.createdAt',
          'entries.entries.updatedAt',
          'entries.stats.lastActivity',
          'settings.settings.data.backupConfig.lastBackup'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;