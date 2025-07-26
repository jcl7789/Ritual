// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import entriesReducer from './entriesSlice';

export const store = configureStore({
  reducer: {
    entries: entriesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas en la verificación de serialización para Date objects
        ignoredActions: ['entries/addEntry', 'entries/updateEntry', 'entries/loadEntries'],
        ignoredPaths: ['entries.entries.date', 'entries.entries.createdAt', 'entries.entries.updatedAt'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;