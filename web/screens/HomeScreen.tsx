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
import { RootState } from '../store/store';
import { HomeScreenProps } from '../types/Navigation';

export default function HomeScreen({ navigation }: HomeScreenProps) {
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
          <Text style={styles.title}>Ritual</Text>
          <Text style={styles.subtitle}>Tu diario personal</Text>
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.averageSatisfaction?.toFixed(1) || '--'}
            </Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
        </View>

        {/* Botón principal para agregar */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddEntry}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Nueva Entrada</Text>
        </TouchableOpacity>

        {/* Entradas recientes */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recientes</Text>
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryIcon}>{entry.activityType.icon}</Text>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryActivity}>{entry.activityType.name}</Text>
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
              <Text style={styles.emptyText}>Aún no tienes entradas</Text>
              <Text style={styles.emptySubtext}>
                Comienza registrando tu primera actividad
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