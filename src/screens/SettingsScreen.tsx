import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CountryFlag from 'react-native-country-flag';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { RootState, AppDispatch } from '../store/store';
import {
  initializeApp,
} from '../store/slices/entriesSlice';
import {
  updateLanguage,
  updatePrivacy,
  resetSettings,
  updateNotifications,
} from '../store/slices/settingsSlice';
import { StorageService } from '../services/storage/StorageService';
import { useStorage } from '../hooks/useStorage';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.entries); // 'loading' de entriesSlice
  const { settings: appSettings } = useSelector((state: RootState) => state.settings); // Obtén todas las configuraciones

  // Estados locales para los Switches, sincronizados con el store de Redux
  const [notificationsEnabled, setNotificationsEnabled] = useState(appSettings.notifications.enabled);
  const [biometricEnabled, setBiometricEnabled] = useState(appSettings.privacy.requireAuth && appSettings.privacy.authMethod === 'biometric');

  // Hook personalizado para operaciones de almacenamiento
  const {
    createBackup: createBackupViaHook,
    exportData: exportDataViaHook,
    importData: importDataViaHook,
  } = useStorage();


  // Sincronizar el estado local con los cambios del store de Redux
  useEffect(() => {
    setNotificationsEnabled(appSettings.notifications.enabled);
    setBiometricEnabled(appSettings.privacy.requireAuth && appSettings.privacy.authMethod === 'biometric');
  }, [appSettings]);


  const handleLanguageChange = (lang: 'en' | 'es') => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      dispatch(updateLanguage(lang));
      Alert.alert(t('settings.language.changedTitle'), t('settings.language.changedMessage', { lng: lang }));
    }
  };

  const handleToggleNotifications = () => {
    const newStatus = !notificationsEnabled;
    setNotificationsEnabled(newStatus);
    dispatch(updateNotifications({ ...appSettings.notifications, enabled: newStatus }));
  };

  const handleToggleBiometric = () => {
    const newStatus = !biometricEnabled;
    setBiometricEnabled(newStatus);
    // Actualiza la configuración de privacidad en Redux
    dispatch(updatePrivacy({
      ...appSettings.privacy,
      requireAuth: newStatus,
      authMethod: newStatus ? 'biometric' : 'none', // Asume 'pin' como método por defecto si biométrico se desactiva
    }));
  };

  const handleCreateBackup = async () => {
    try {
      await createBackupViaHook(); // Usa el hook
      Alert.alert(
        t('settings.backup.success.title'),
        t('settings.backup.success.message')
      );
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        t('settings.backup.error.message', { error: err.message })
      );
    }
  };

  const handleExportData = async () => {
    try {
      const exportedJson = await exportDataViaHook(); // Usa el hook
      // Exportar directamente el JSON. Nota: btoa puede no estar disponible en todos los RN env.
      // Para RN puro o entornos sin btoa, considera una librería de base64 o guardar a archivo temporal.
      // Expo-sharing puede manejar directamente URIs de archivos creados con FileSystem.
      const fileUri = FileSystem.cacheDirectory + 'ritual_data_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, exportedJson, { encoding: FileSystem.EncodingType.UTF8 });

      await Share.share({
        message: t('settings.export.shareMessage'),
        url: fileUri, // Compartir URI del archivo local
      }, {
        dialogTitle: t('settings.export.shareTitle'),
      });
      Alert.alert(t('settings.export.success.title'), t('settings.export.success.message'));
    } catch (err: any) {
      console.error('Error exporting data:', err);
      Alert.alert(t('common.error'), t('settings.export.error.message', { error: err.message }));
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      t('settings.import.confirmTitle'),
      t('settings.import.confirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.continue'),
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json', // O el tipo MIME de tus archivos de backup
              });

              if (result.canceled === false && result.assets && result.assets.length > 0) {
                const fileUri = result.assets[0].uri;
                const fileContent = await FileSystem.readAsStringAsync(fileUri);
                await importDataViaHook(fileContent); // Usa el hook
                Alert.alert(t('settings.import.success.title'), t('settings.import.success.message'));
                // Opcionalmente, recargar los datos de la aplicación después de la importación
                dispatch(initializeApp()); // Re-inicializa el estado de la app después de importar
              }
            } catch (err: any) {
              console.error('Error importing data:', err);
              Alert.alert(t('common.error'), t('settings.import.error.message', { error: err.message }));
            }
          },
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      t('settings.reset.confirmTitle'),
      t('settings.reset.confirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await StorageService.clearAllData(); // Llama directamente al servicio
              dispatch(resetSettings()); // Reinicia el estado de Redux de settings
              dispatch(initializeApp()); // Esto debería re-ejecutar FirstLoadScreen si es la primera vez
              Alert.alert(t('settings.reset.success.title'), t('settings.reset.success.message'));
            } catch (err: any) {
              console.error('Error resetting all data:', err);
              Alert.alert(t('common.error'), t('settings.reset.error.message', { error: err.message }));
            }
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Configuración General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.general.title')}</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.language.label')}</Text>
            <View style={styles.languageSelectionContainer}>
              <TouchableOpacity
                style={[styles.languageButton, appSettings.language === 'es' && styles.languageButtonActive]}
                onPress={() => handleLanguageChange('es')}
              >
                <CountryFlag isoCode="ar" size={25} style={{ marginRight: 8 }} />
                <Text style={[styles.languageButtonText, appSettings.language === 'es' && styles.languageButtonTextActive]}>Español</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageButton, appSettings.language === 'en' && styles.languageButtonActive]}
                onPress={() => handleLanguageChange('en')}
              >
                <CountryFlag isoCode="us" size={25} style={{ marginRight: 8 }} />
                <Text style={[styles.languageButtonText, appSettings.language === 'en' && styles.languageButtonTextActive]}>English</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.settingItem, { marginTop: 10 }]}>
            <Text style={styles.settingLabel}>{t('settings.notifications.label')}</Text>
            <Switch
              onValueChange={handleToggleNotifications}
              value={notificationsEnabled}
              trackColor={{ false: '#767577', true: '#818cf8' }}
              thumbColor={notificationsEnabled ? '#6366f1' : '#f4f3f4'}
            />
          </View>
          {/* Aquí podrías añadir un selector de tema si lo implementas */}
        </View>

        {/* Privacidad y Seguridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.privacySecurity.title')}</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.privacy.biometricAuth')}</Text>
            <Switch
              onValueChange={handleToggleBiometric}
              value={biometricEnabled}
              trackColor={{ false: '#767577', true: '#818cf8' }}
              thumbColor={biometricEnabled ? '#6366f1' : '#f4f3f4'}
            />
          </View>
          {/* Otros ajustes de privacidad si los tienes (ej. auto-lock, modo privado) */}
        </View>

        {/* Gestión de Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement.title')}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateBackup} disabled={loading}>
            <Ionicons name="cloud-upload-outline" size={24} color="#6366f1" />
            <Text style={styles.actionButtonText}>{t('settings.backup.create')}</Text>
            {loading && <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportData} disabled={loading}>
            <Ionicons name="share-outline" size={24} color="#6366f1" />
            <Text style={styles.actionButtonText}>{t('settings.export.title')}</Text>
            {loading && <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleImportData} disabled={loading}>
            <Ionicons name="cloud-download-outline" size={24} color="#6366f1" />
            <Text style={styles.actionButtonText}>{t('settings.import.title')}</Text>
            {loading && <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dangerZone.title')}</Text>
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={handleResetAllData} disabled={loading}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.resetButtonText]}>{t('settings.reset.resetAll')}</Text>
            {loading && <ActivityIndicator size="small" color="#ef4444" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        </View>

        {/* Acerca de */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about.title')}</Text>
          <Text style={styles.aboutText}>{t('settings.about.version', { version: '1.0.0' })}</Text>
          <Text style={styles.aboutText}>{t('settings.about.developer')}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://yourwebsite.com/privacy-policy')}>
            <Text style={styles.linkText}>{t('settings.about.privacyPolicy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://yourwebsite.com/terms-of-service')}>
            <Text style={styles.linkText}>{t('settings.about.termsOfService')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1, // ¡Añade esta línea! Hace que el ScrollView ocupe todo el espacio disponible
  },
  scrollViewContent: {
    flexGrow: 1, // Permite que el contenido se expanda si es menor que el ScrollView
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  languageSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1, // Permite que los botones ocupen el espacio
    marginLeft: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8, // Ajuste de padding
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4, // Espacio entre botones
  },
  languageButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  languageButtonText: {
    fontSize: 14, // Ajuste de tamaño de fuente
    color: '#6b7280',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1, // Permite que el texto ocupe el espacio y empuje el spinner a la derecha
  },
  resetButton: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: '#fee2e2',
  },
  resetButtonText: {
    color: '#ef4444',
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#6366f1',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
});