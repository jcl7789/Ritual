// src/locales/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Importar traducciones
import enCommon from './en/common.json';
import esCommon from './es/common.json';

// Recursos de traducciones
const resources = {
  en: {
    common: enCommon,
  },
  es: {
    common: esCommon,
  },
};

// Detectar idioma del sistema
const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const primaryLocale = locales[0];
    const languageCode = primaryLocale.languageCode;
    
    // Soportar solo inglés y español
    if (languageCode === 'es') return 'es';
    return 'en'; // Default a inglés
  }
  return 'en';
};

// Configuración de i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // Detectar idioma del dispositivo
    fallbackLng: 'en', // Idioma por defecto
    
    // Namespace por defecto
    defaultNS: 'common',
    
    // Configuración de interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    react: {
      useSuspense: false, // Desactivar suspense para evitar problemas con la carga de traducciones
    },
    
    // Configuración de detección
    detection: {
      // Orden de detección de idioma
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // Configuración para desarrollo
    debug: __DEV__,
  });

export default i18n;