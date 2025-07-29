import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { AppDispatch } from '../store/store';
import { completeOnboarding, updateLanguage, updatePrivacy } from '../store/slices/settingsSlice';
import CountryFlag from 'react-native-country-flag';
import { getDeviceLanguage } from '../locales/i18n';
import { UserProfile } from '../types';
import { Controller, FieldError, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { ValidationService } from '../services/validation/ValidationService';
import { maxAge, maxNameLength, minAge, minNameLength, OnboardingFormData } from '../schemas/validation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'onboarding.welcome.title',
    subtitle: 'onboarding.welcome.subtitle',
    description: 'onboarding.welcome.description',
    icon: 'heart-outline',
    color: '#6366f1',
    gradient: ['#6366f1', '#8b5cf6']
  },
  {
    id: 'privacy',
    title: 'onboarding.privacy.title',
    subtitle: 'onboarding.privacy.subtitle',
    description: 'onboarding.privacy.description',
    icon: 'shield-checkmark-outline',
    color: '#059669',
    gradient: ['#059669', '#10b981']
  },
  {
    id: 'tracking',
    title: 'onboarding.tracking.title',
    subtitle: 'onboarding.tracking.subtitle',
    description: 'onboarding.tracking.description',
    icon: 'analytics-outline',
    color: '#dc2626',
    gradient: ['#dc2626', '#ef4444']
  },
  {
    id: 'features',
    title: 'onboarding.features.title',
    subtitle: 'onboarding.features.subtitle',
    description: 'onboarding.features.description',
    icon: 'star-outline',
    color: '#d97706',
    gradient: ['#d97706', '#f59e0b']
  },
  {
    id: 'profile',
    title: 'onboarding.profile.title',
    subtitle: 'onboarding.profile.subtitle',
    description: 'onboarding.profile.description',
    icon: 'shield-checkmark-outline',
    color: '#050f96ff',
    gradient: ['#050f96ff', '#1b27c7ff']
  }
];

interface FirstLoadProps {
  onComplete: (userProfile: UserProfile) => void;
}

export default function FirstLoad({ onComplete }: FirstLoadProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>(getDeviceLanguage() as 'en' | 'es');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [ageError, setAgeError] = useState<string | undefined>(undefined);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    handleSubmit,
    control,
    formState: { errors },
    setError
  } = useForm<OnboardingFormData>({
    mode: 'onBlur',
    defaultValues: {
      profile: {
        name: '',
        age: undefined,
      },
      settings: {
        privacy: {
          requireAuth: false,
          authMethod: 'none',
        },
        notifications: {
          enabled: false,
        },
        language: getDeviceLanguage() as 'en' | 'es',
        firstLaunch: true,
        onboardingCompleted: false,
        analyticsEnabled: true,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'profile.partners',
  });

  const getError = (error: FieldError) => {
    console.error('Validation error:', error);
    return t(error.message || '')
  }

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      // Animación de transición
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * screenWidth, animated: false });

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleSubmit(handleComplete)(); // Completar el onboarding
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        scrollViewRef.current?.scrollTo({ x: (currentStep - 1) * screenWidth, animated: false });

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleComplete: SubmitHandler<OnboardingFormData> = async (formData) => {
    if (currentStep === 4) {
      if (errors.profile?.name?.type === 'required' || errors.profile?.age?.type === 'required') {
        Alert.alert(
          t('onboarding.error.title') || 'Error',
          t('onboarding.error.profileIncomplete') || 'Please complete your profile before finishing.',
          [{ text: t('common.ok') || 'OK' }]
        );
        return;
      }

      const profileValidationResult = await ValidationService.validateUserProfile(formData.profile); // Aquí asumo que userSettingsSchema puede validar el perfil. Si no, necesitarías un schema específico para el perfil.
      if (!profileValidationResult.isValid) {
        // Mostrar errores de validación de configuración
        if (profileValidationResult.errors) {
          const name = profileValidationResult.errors['name'];
          // Asegúrate de que son strings, como lo confirma tu log
          if (typeof name === 'string') {
            setNameError(name);
          }
          const age = profileValidationResult.errors['age'];
          if (typeof age === 'string') {
            setAgeError(age);
          }
        }
        Alert.alert(
          t('onboarding.error.title') || 'Error de Validación',
          `Errores en el perfil: ${JSON.stringify(profileValidationResult.errors)}`, // Mostrar errores de validación
          [{ text: t('common.ok') || 'OK' }],
          { cancelable: false }
        );
        setIsCompleting(false);
        return;
      }

      const userSettingsValidationResult = await ValidationService.validateUserSettings(formData.settings);
      if (!userSettingsValidationResult.isValid) {
        Alert.alert(
          t('onboarding.error.title') || 'Error de Validación',
          `Errores en la configuración: ${JSON.stringify(userSettingsValidationResult.errors)}`,
          [{ text: t('common.ok') || 'OK' }]
        );
        setIsCompleting(false);
        return;
      }

      if (isCompleting) return; // Prevenir múltiples ejecuciones
      setIsCompleting(true);

      try {
        // 1. Aplicar configuración de idioma
        await dispatch(updateLanguage(selectedLanguage)).unwrap();

        // 2. Aplicar configuración de privacidad si está habilitada
        if (enableBiometric) {
          await dispatch(updatePrivacy({
            requireAuth: formData.settings.privacy.requireAuth,
            authMethod: 'biometric',
          })).unwrap();
        }

        // 3. Marcar onboarding como completado
        await dispatch(completeOnboarding()).unwrap();

        // 4. Callback para indicar que se completó (esto actualizará el estado en App)
        await onComplete(formData.profile);
      } catch (error) {
        console.error('Error completing onboarding:', error);

        // Mostrar error al usuario
        Alert.alert(
          t('onboarding.error.title') || 'Error',
          t('onboarding.error.message') || 'There was an error setting up the app. Please try again.',
          [
            {
              text: t('common.retry') || 'Retry',
              onPress: () => {
                setIsCompleting(false);
                handleComplete(formData);
              }
            }
          ]
        );
      }
    }
  };

  const renderLanguageSelector = () => {
    if (currentStep !== 0) return null;

    return (
      <View style={styles.languageSelector}>
        <Text style={styles.languageTitle}>{t('onboarding.selectLanguage')}</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              selectedLanguage === 'es' && styles.languageButtonActive
            ]}
            onPress={() => {
              setSelectedLanguage('es');
              i18n.changeLanguage('es');
            }}
          >
            <CountryFlag
              isoCode="ES"
              size={32}
              style={styles.languageFlag} />
            <Text style={[
              styles.languageText,
              selectedLanguage === 'es' && styles.languageTextActive
            ]}>
              Español
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              selectedLanguage === 'en' && styles.languageButtonActive
            ]}
            onPress={() => {
              setSelectedLanguage('en');
              i18n.changeLanguage('en');
            }}
          >
            <CountryFlag
              isoCode="US"
              size={32}
              style={styles.languageFlag} />
            <Text style={[
              styles.languageText,
              selectedLanguage === 'en' && styles.languageTextActive
            ]}>
              English
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProfileForm = () => {
    if (currentStep !== 4) return null;
    return (
      <View style={styles.profileForm}>

        <Controller
          control={control}
          name="profile.name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.profile.namePlaceholder')}
                value={value}
                onChangeText={onChange}
              />

            </>
          )}
        />
        {nameError && (<Text style={styles.formError}>
          {t(nameError, { min: minNameLength, max: maxNameLength })}
        </Text>
        )}
        <Controller
          control={control}
          name="profile.age"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={styles.textInput}
                placeholder={t('onboarding.profile.agePlaceholder')}
                keyboardType="numeric"
                value={ value ? value.toString() : ''}
                onChangeText={(text) => onChange(parseInt(text))}
              />
            </>
          )}
        />

        {ageError && (<Text style={styles.formError}>
          {t(ageError, { min: minAge, max: maxAge })}
        </Text>
        )}

        {/* Lista de parejas */}
        {fields.map((field, index) => (
          <View key={field.id} style={styles.partnerRow}>
            <Controller
              control={control}
              name={`profile.partners.${index}.name`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.partnerInput}
                  placeholder={t('onboarding.profile.partnerNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <TouchableOpacity
              style={styles.removePartnerButton}
              onPress={() => remove(index)}
            >
              <Ionicons name="trash-outline" size={24} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addPartnerButton}
          onPress={() => append({ id: '', name: '' })}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4ade80" />
          <Text style={styles.addPartnerText}>{t('onboarding.profile.addPartner')}</Text>
        </TouchableOpacity>

      </View>
    );
  }

  const renderBiometricOption = () => {
    if (currentStep !== 1) return null;

    return (
      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[
            styles.biometricOption,
            enableBiometric && styles.biometricOptionActive
          ]}
          onPress={() => setEnableBiometric(!enableBiometric)}
        >
          <Ionicons
            name={enableBiometric ? 'checkbox' : 'square-outline'}
            size={24}
            color={enableBiometric ? '#6366f1' : '#9ca3af'}
          />
          <View style={styles.biometricTextContainer}>
            <Text style={styles.biometricTitle}>
              {t('onboarding.enableBiometric')}
            </Text>
            <Text style={styles.biometricSubtitle}>
              {t('onboarding.biometricDescription')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {onboardingSteps.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor: index <= currentStep ? onboardingSteps[currentStep].color : '#e5e7eb',
              width: index === currentStep ? 24 : 8,
            }
          ]}
        />
      ))}
    </View>
  );

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={styles.stepContainer}>
      <LinearGradient
        colors={step.gradient as [string, string]}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={step.icon as any} size={60} color="white" />
      </LinearGradient>

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <Text style={styles.stepTitle}>{t(step.title)}</Text>
        <Text style={styles.stepSubtitle}>{t(step.subtitle)}</Text>
        <Text style={styles.stepDescription}>{t(step.description)}</Text>

        {renderLanguageSelector()}
        {renderBiometricOption()}
        {renderProfileForm()}
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('onboarding.setup')}</Text>
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {onboardingSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.navButton,
            styles.prevButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentStep === 0 ? '#9ca3af' : '#6b7280'} />
          <Text style={[
            styles.navButtonText,
            currentStep === 0 && styles.navButtonTextDisabled
          ]}>
            {t('onboarding.previous')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: onboardingSteps[currentStep].color },
            isCompleting && styles.navButtonDisabled
          ]}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <>
              <Animated.View style={{ marginRight: 8 }}>
                <Ionicons name="refresh" size={24} color="white" />
              </Animated.View>
              <Text style={styles.nextButtonText}>
                {t('onboarding.saving') || 'Saving...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === onboardingSteps.length - 1
                  ? t('onboarding.getStarted')
                  : t('onboarding.next')
                }
              </Text>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: screenWidth,
    height: screenHeight - 150, // Ajustar según el header y la navegación
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  stepDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  languageSelector: {
    width: '100%',
    alignItems: 'center',
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  languageButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'white',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  languageFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  optionContainer: {
    width: '100%',
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  biometricOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  biometricTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  biometricSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  prevButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'flex-start',
  },
  nextButton: {
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  nextButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  profileForm: {
    flex: 1, // Ocupa todo el espacio disponible
    padding: 20,
    backgroundColor: '#f8f8f8', // Un fondo claro
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'center', // Centra el contenido horizontalmente
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  textInput: {
    width: '90%', // Ocupa la mayor parte del ancho
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000', // Sombra para dar profundidad
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Elevación para Android
  },
  partnerRow: {
    flexDirection: 'row', // Elementos en línea
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
  },
  partnerInput: {
    flex: 1, // Ocupa el espacio restante
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    marginRight: 10, // Espacio entre el input y el botón
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  removePartnerButton: {
    padding: 10,
    borderRadius: 25, // Botón redondo
    backgroundColor: '#ffebee', // Fondo suave para el botón de eliminar
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPartnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6ffe6', // Fondo suave para el botón de añadir
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addPartnerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e', // Color verde para añadir
  },
  submitButton: {
    width: '90%',
    backgroundColor: '#4f46e5', // Un azul vibrante
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formError: {
    color: '#dc2626', // Rojo para errores
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    width: '90%',
  }
});
