// src/locales/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from './es';
import en from './en';

// Get the user's primary locale, with a fallback for safety
const primaryLocale = Localization.getLocales()[0];
const languageCode = primaryLocale?.languageCode || 'en'; // Safely access, default to 'en'

const resources = {
  es: { translation: es },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languageCode, // Usar idioma del dispositivo
    fallbackLng: 'en',
    debug: __DEV__, // Solo en desarrollo
    
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    
    // Configuración para React Native
    compatibilityJSON: 'v4',
  });

export default i18n;