// src/screens/AddEntryScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { addEntryAsync } from '../store/slices/entriesSlice';
import { DEFAULT_ACTIVITIES, ActivityType, CreateEntryInput } from '../types/Entry';
import { AddEntryScreenProps } from '../types/Navigation';
import { AppDispatch, RootState } from '../store/store';

interface FormData {
  activityType: ActivityType;
  partner?: string;
  duration?: number;
  satisfaction?: number;
  notes?: string;
}

export default function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.entries);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [selectedSatisfaction, setSelectedSatisfaction] = useState<number | null>(null);

  const getActualPartner = (): string => {
    if (user?.profile?.actualPartner) {
      return user.profile.partners[user.profile.actualPartner]?.name ?? '';
    }
    return '';
  };


  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      partner: getActualPartner(),
    }
  });

   // Actualizar el valor por defecto cuando el perfil de usuario cambie
  useEffect(() => {
    if (user?.profile?.actualPartner) {
      setValue('partner', user.profile.partners[user.profile.actualPartner]?.name ?? '');
    }
  }, [user, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!selectedActivity) {
      Alert.alert(t('common.error'), t('addEntry.error.activityRequired'));
      return;
    }

    const newEntry: CreateEntryInput = {
      date: new Date(),
      activityType: selectedActivity,
      partner: data.partner?.trim() || undefined,
      duration: data.duration || undefined,
      satisfaction: selectedSatisfaction || undefined,
      notes: data.notes?.trim() || undefined,
    };
try {
    await dispatch(addEntryAsync(newEntry)).unwrap();
    
    Alert.alert(
      t('addEntry.success.title'),
      t('addEntry.success.message'),
      [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]
    );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error as string || 'Failed to save entry'
      );
      console.log('Error saving entry:', error, errors);
    }
  };

  const renderSatisfactionStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setSelectedSatisfaction(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= (selectedSatisfaction || 0) ? 'star' : 'star-outline'}
            size={32}
            color={i <= (selectedSatisfaction || 0) ? '#fbbf24' : '#d1d5db'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={true}>
        {/* Selector de actividad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addEntry.activityType')}</Text>
          <View style={styles.activitiesGrid}>
            {DEFAULT_ACTIVITIES.map((activity:  ActivityType) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityCard,
                  selectedActivity?.id === activity.id && styles.activityCardSelected
                ]}
                onPress={() => setSelectedActivity(activity)}
              >
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <Text style={[
                  styles.activityName,
                  selectedActivity?.id === activity.id && styles.activityNameSelected
                ]}>
                  {t(activity.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pareja (opcional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addEntry.partner')}</Text>
          <Controller
            control={control}
            name="partner"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textInput}
                placeholder={t('addEntry.partnerPlaceholder')}
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
              />
            )}
          />
        </View>

        {/* Duración (opcional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addEntry.duration')}</Text>
          <Controller
            control={control}
            name="duration"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textInput}
                placeholder={t('addEntry.durationPlaceholder')}
                value={value?.toString()}
                onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                keyboardType="numeric"
              />
            )}
          />
        </View>

        {/* Satisfacción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addEntry.satisfaction')}</Text>
          <View style={styles.starsContainer}>
            {renderSatisfactionStars()}
          </View>
          {selectedSatisfaction && (
            <Text style={styles.satisfactionLabel}>
              {t('addEntry.satisfactionLabel', { stars: selectedSatisfaction })}
            </Text>
          )}
        </View>

        {/* Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('addEntry.notes')}</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder={t('addEntry.notesPlaceholder')}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Ionicons name="checkmark" size={24} color="white" />
          <Text style={styles.saveButtonText}>{t('addEntry.save')}</Text>
        </TouchableOpacity>

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
    // padding is now handled by contentContainerStyle
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  activityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  activityName: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  activityNameSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesInput: {
    height: 100,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  satisfactionLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 30,
  },
});