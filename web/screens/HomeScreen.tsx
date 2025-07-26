// src/screens/HomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { HomeScreenProps } from '../types/Navigation';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t, i18n } = useTranslation();

  // Function to change the language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const { stats, entries } = useSelector((state: RootState) => state.entries);

  const recentEntries = entries.slice(0, 3); // Últimas 3 entradas

  const handleAddEntry = () => {
    navigation.navigate('AddEntry');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

          <View style={styles.languageSwitcher}>
            {/* Spanish language selector button */}
            <TouchableOpacity
              style={[styles.button, i18n.language === 'es' ? styles.activeButton : styles.inactiveButton]}
              onPress={() => changeLanguage('es')} // Call changeLanguage with 'es' on press
              accessibilityLabel={t('spanishLanguage')} // Accessibility label for Spanish button
            >
              {/* CountryFlag para España */}
              <CountryFlag isoCode="ES" size={30} style={styles.flagIcon} />
            </TouchableOpacity>

            {/* English language selector button */}
            <TouchableOpacity
              style={[styles.button, i18n.language === 'en' ? styles.activeButton : styles.inactiveButton]}
              onPress={() => changeLanguage('en')} // Call changeLanguage with 'en' on press
              accessibilityLabel={t('englishLanguage')} // Accessibility label for English button
            >
              {/* CountryFlag para Reino Unido (Inglaterra) */}
              <CountryFlag isoCode="GB" size={30} style={styles.flagIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>{t('home.stats.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>{t('home.stats.thisMonth')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.averageSatisfaction?.toFixed(1) || '--'}
            </Text>
            <Text style={styles.statLabel}>{t('home.stats.average')}</Text>
          </View>
        </View>

        {/* Botón principal para agregar */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddEntry}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>{t('home.addEntry')}</Text>
        </TouchableOpacity>

        {/* Entradas recientes */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>{t('home.recentEntries')}</Text>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryIcon}>{entry.activityType.icon}</Text>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryActivity}>{t(entry.activityType.name)}</Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.date).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  {entry.satisfaction && (
                    <View style={styles.satisfaction}>
                      <Text style={styles.satisfactionText}>
                        {'★'.repeat(entry.satisfaction)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>{t('home.empty.title')}</Text>
              <Text style={styles.emptySubtext}>
                {t('home.empty.subtitle')}
              </Text>
            </View>
          )}
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  languageSwitcher: {
    position: 'absolute', // Position absolutely
    top: 0, // Align to the top
    right: 0, // Align to the right
    padding: 16, // Padding around the language switcher
    flexDirection: 'row', // Arrange buttons in a row
    gap: 16, // Space between buttons
  },
  button: {
    flexDirection: 'row', // Arrange flag and text in a row
    alignItems: 'center', // Center items vertically
    justifyContent: 'center', // Center items horizontally
    width: 60, // Fixed width for round button
    height: 60, // Fixed height for round button
    borderRadius: 30, // Make it round (half of width/height)
    padding: 8, // Padding inside the button
    shadowColor: '#000', // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.2, // Shadow opacity
    shadowRadius: 4, // Shadow blur radius
    elevation: 5, // Elevation for Android shadow
    gap: 4, // Added gap between flag and text
  },
  activeButton: {
    backgroundColor: '#3b82f6', // Blue background for active button
  },
  inactiveButton: {
    backgroundColor: '#ffffff', // White background for inactive button
  },
  flagIcon: { // New style for the flag
    // Removed marginRight, now handled by gap
  },
  activeText: {
    color: '#ffffff', // White text for active button
    fontWeight: 'bold', // Bold font weight
    fontSize: 18, // Font size for text
  },
  inactiveText: {
    color: '#4b5563', // Gray text for inactive button
    fontWeight: 'bold', // Bold font weight
    fontSize: 18, // Font size for text
  },
  addButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  recentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryActivity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  satisfaction: {
    alignItems: 'flex-end',
  },
  satisfactionText: {
    fontSize: 16,
    color: '#fbbf24',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});