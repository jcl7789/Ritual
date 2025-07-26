// src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { RootState, AppDispatch } from '../store/store';
import { 
  createBackupAsync, 
  exportDataAsync, 
  importDataAsync} from '../store/slices/entriesSlice';
import { StorageService } from '../services/storage/StorageService';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, stats } = useSelector((state: RootState) => state.entries);
  const [notifications, setNotifications] = useState(true);

  const handleCreateBackup = async () => {
    try {
      await dispatch(createBackupAsync()).unwrap();
      Alert.alert(
        t('settings.backup.success.title'),
        t('settings.backup.success.message')
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error as string
      );
    }
  };

  const handleExportData = async () => {
    try {
      const exportedData = await dispatch(exportDataAsync()).unwrap();
      
      // Crear nombre de archivo con fecha
      const dateString = new Date().toISOString().split('T')[0];
      const fileName = `ritual_backup_${dateString}.txt`;
      
      // Compartir el archivo
      await Share.share({
        message: exportedData,
        title: t('settings.export.shareTitle'),
      });
      
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error as string
      );
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      t('settings.import.confirmTitle'),
      t('settings.import.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.import.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // En una implementación real, aquí abrirías un selector de archivos
              // Por simplicidad, se podría usar un TextInput para pegar los datos
              Alert.prompt(
                t('settings.import.pasteTitle'),
                t('settings.import.pasteMessage'),
                async (encryptedData) => {
                  if (encryptedData) {
                    await dispatch(importDataAsync(encryptedData)).unwrap();
                    Alert.alert(
                      t('settings.import.success.title'),
                      t('settings.import.success.message')
                    );
                  }
                }
              );
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error as string
              );
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      t('settings.clearData.confirmTitle'),
      t('settings.clearData.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearData.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert(
                t('settings.clearData.success.title'),
                t('settings.clearData.success.message')
              );
              // Recargar la app
              // navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } catch (error) {
              Alert.alert(
                t('common.error'),
                'Failed to clear data'
              );
            }
          }
        }
      ]
    );
  };

  const changeLanguage = (language: 'es' | 'en') => {
    i18n.changeLanguage(language);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* Estadísticas de la App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appStats.title')}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('settings.appStats.totalEntries')}</Text>
              <Text style={styles.statValue}>{stats.totalEntries}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('settings.appStats.thisMonth')}</Text>
              <Text style={styles.statValue}>{stats.thisMonth}</Text>
            </View>
            {stats.lastActivity && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('settings.appStats.lastActivity')}</Text>
                <Text style={styles.statValue}>
                  {new Date(stats.lastActivity).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === 'es' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('es')}
            >
              <Text style={[
                styles.languageButtonText,
                i18n.language === 'es' && styles.languageButtonTextActive
              ]}>
                🇪🇸 Español
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === 'en' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.languageButtonText,
                i18n.language === 'en' && styles.languageButtonTextActive
              ]}>
                🇬🇧 English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications.title')}</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>
              {t('settings.notifications.enabled')}
            </Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor={notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Datos y Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataManagement.title')}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={handleCreateBackup}
            disabled={loading}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color="#6366f1" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>
                {t('settings.backup.title')}
              </Text>
              <Text style={styles.actionButtonSubtitle}>
                {t('settings.backup.subtitle')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={handleExportData}
            disabled={loading}
          >
            <Ionicons name="download-outline" size={24} color="#059669" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>
                {t('settings.export.title')}
              </Text>
              <Text style={styles.actionButtonSubtitle}>
                {t('settings.export.subtitle')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={handleImportData}
            disabled={loading}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#d97706" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>
                {t('settings.import.title')}
              </Text>
              <Text style={styles.actionButtonSubtitle}>
                {t('settings.import.subtitle')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Zona Peligrosa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dangerZone.title')}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearAllData}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
            <View style={styles.actionButtonContent}>
              <Text style={[styles.actionButtonTitle, styles.dangerText]}>
                {t('settings.clearData.title')}
              </Text>
              <Text style={styles.actionButtonSubtitle}>
                {t('settings.clearData.subtitle')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#6366f1',
    fontWeight: '600',
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
  disabledButton: {
    opacity: 0.5,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  actionButtonContent: {
    marginLeft: 16,
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  dangerText: {
    color: '#ef4444',
  },
  bottomPadding: {
    height: 30,
  },
});