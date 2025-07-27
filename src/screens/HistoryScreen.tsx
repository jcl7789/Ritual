// src/screens/HistoryScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { AppDispatch, RootState } from '../store/store';
import { deleteEntryAsync } from '../store/slices/entriesSlice';
import { Entry } from '../types/Entry';
import { HistoryScreenProps } from '../types/Navigation';

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { entries } = useSelector((state: RootState) => state.entries);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');

  // Filtrar entradas por período
  const getFilteredEntries = () => {
    const now = new Date();

    switch (selectedPeriod) {
      case 'week':
        {
          const weekStart = startOfWeek(now, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
          return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart && entryDate <= weekEnd;
          });
        }
      case 'month':
        {
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
          });
        }
      default:
        return entries;
    }
  };

  const filteredEntries = getFilteredEntries();

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return t('history.time.today');
    } else if (isYesterday(date)) {
      return t('history.time.yesterday');
    } else {
      return format(date, 'dd/MM/yyyy', { locale: es });
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      t('history.delete.title'),
      t('history.delete.message'),
      [
        {
          text: t('history.delete.cancel'),
          style: 'cancel',
        },
        {
          text: t('history.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteEntryAsync(entryId)).unwrap();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error as string || 'Failed to delete entry'
              );
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }: { item: Entry }) => {
    const entryDate = new Date(item.date);

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryDateContainer}>
            <Text style={styles.entryDate}>{formatDate(entryDate)}</Text>
            <Text style={styles.entryTime}>{formatTime(entryDate)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteEntry(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.entryContent}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityIcon}>{item.activityType.icon}</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>{t(item.activityType.name)}</Text>
              {item.partner && (
                <Text style={styles.partnerName}>{t('history.time.with', { partner: typeof item.partner === 'object' && item.partner !== null ? (item.partner as any).name : item.partner })}</Text>
              )}
            </View>
          </View>

          <View style={styles.entryMeta}>
            {item.satisfaction && (
              <View style={styles.satisfaction}>
                <Text style={styles.satisfactionStars}>
                  {'★'.repeat(item.satisfaction)}
                </Text>
              </View>
            )}
            {item.duration && (
              <Text style={styles.duration}>{item.duration} min</Text>
            )}
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>{t('history.empty.title')}</Text>
      <Text style={styles.emptySubtext}>
        {selectedPeriod === 'all'
          ? t('history.empty.subtitle')
          : selectedPeriod === 'week' ? t('history.empty.subtitlePeriod') : t('history.empty.subtitleMonth')
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedPeriod === 'all' && styles.filterButtonTextActive
            ]}>
              {t('history.filters.all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === 'week' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedPeriod === 'week' && styles.filterButtonTextActive
            ]}>
              {t('history.filters.week')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === 'month' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedPeriod === 'month' && styles.filterButtonTextActive
            ]}>
              {t('history.filters.month')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de entradas */}
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  list: {
    // padding is now handled by contentContainerStyle
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  entryTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  entryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  partnerName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  entryMeta: {
    alignItems: 'flex-end',
  },
  satisfaction: {
    marginBottom: 4,
  },
  satisfactionStars: {
    fontSize: 14,
    color: '#fbbf24',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notes: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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