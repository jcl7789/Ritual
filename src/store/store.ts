// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import entriesReducer from './slices/entriesSlice';

export const store = configureStore({
  reducer: {
    entries: entriesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas en la verificación de serialización para Date objects
        ignoredActions: [
          'entries/addEntryAsync/fulfilled',
          'entries/updateEntryAsync/fulfilled',
          'entries/initializeApp/fulfilled',
          'entries/importDataAsync/fulfilled'
        ],
        ignoredPaths: [
          'entries.entries.date',
          'entries.entries.createdAt',
          'entries.entries.updatedAt',
          'entries.stats.lastActivity'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;