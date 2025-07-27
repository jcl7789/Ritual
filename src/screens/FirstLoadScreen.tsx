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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { AppDispatch } from '../store/store';
import { completeOnboarding, updateLanguage, updatePrivacy } from '../store/slices/settingsSlice';

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
  }
];

interface FirstLoadProps {
  onComplete: () => void;
}

export default function FirstLoad({ onComplete }: FirstLoadProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
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
      handleComplete();
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

  const handleComplete = async () => {
    if (isCompleting) return; // Prevenir múltiples ejecuciones
    
    setIsCompleting(true);
    
    try {
      console.log('Starting onboarding completion...');
      
      // 1. Aplicar configuración de idioma
      console.log('Setting language to:', selectedLanguage);
      await dispatch(updateLanguage(selectedLanguage)).unwrap();
      
      // 2. Aplicar configuración de privacidad si está habilitada
      if (enableBiometric) {
        console.log('Enabling biometric authentication');
        await dispatch(updatePrivacy({ 
          requireAuth: true, 
          authMethod: 'biometric' 
        })).unwrap();
      }
      
      // 3. Marcar onboarding como completado
      console.log('Completing onboarding...');
      await dispatch(completeOnboarding()).unwrap();
      
      console.log('Onboarding completed successfully');
      
      // 4. Callback para indicar que se completó (esto actualizará el estado en App)
      onComplete();
      
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
              handleComplete();
            }
          },
          {
            text: t('common.continue') || 'Continue anyway',
            onPress: () => {
              // Continuar de todas formas
              onComplete();
            }
          }
        ]
      );
    } finally {
      setIsCompleting(false);
    }
  };

  // Remover la función handleSkip para que no sea omitible
  // const handleSkip = () => {
  //   handleComplete();
  // };

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
            <Text style={styles.languageFlag}>🇪🇸</Text>
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
            <Text style={styles.languageFlag}>🇺🇸</Text>
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
        colors={step.gradient as [import('react-native').ColorValue, import('react-native').ColorValue, ...import('react-native').ColorValue[]]}
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
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Removido el botón Skip para que no sea omitible */}
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
});