// App.tsx

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { AppDispatch, RootState, store } from './src/store/store';
import Navigation from './src/components/navigation/Navigation';
import FirstLoadScreen from './src/screens/FirstLoadScreen';
import './src/locales/i18n'; // Inicializar i18n
import { useTranslation } from 'react-i18next';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { initializeApp } from './src/store/slices/entriesSlice';
import { useStorage } from './src/hooks/useStorage';
import { UserProfile } from './src/types';

// Componente para manejar la inicialización
function AppInitializer() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { initialized, loading, error, isFirstTime } = useSelector((state: RootState) => state.entries);
  const storage = useStorage();

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeApp());
    }
  }, [dispatch, initialized]);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    console.log('Onboarding completed callback received');
    await storage.saveProfile(profile);
    // No necesitas retornar nada aquí, solo actualizar el estado
  };

  // Pantalla de carga mientras se inicializa la app
  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{t('app.loading.title')}</Text>
      </View>
    );
  }

  // Pantalla de error si no se puede inicializar
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t('app.loading.error.title')}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>
          {t('app.loading.error.message')}
        </Text>
      </View>
    );
  }

  // Si es primera vez, mostrar pantalla de configuración inicial
  if (isFirstTime) {
    return (
      <FirstLoadScreen 
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // App principal
  return (
    <NavigationContainer>
      <Navigation />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInitializer />
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});