import * as yup from 'yup';

const minAge = 12;
const maxAge = 90;
const minNameLength = 2;
const maxNameLength = 50;
const maxPartnerNameLength = 50;
const maxDuration = 1440; // 24 hours in minutes
const minSatisfaction = 1;
const maxSatisfaction = 5;
const maxNotesLength = 500;

export { minAge, maxAge, minNameLength, maxNameLength, maxPartnerNameLength, maxDuration, minSatisfaction, maxSatisfaction, maxNotesLength };

// Schema para partner
export const partnerSchema = yup.object().shape({
  id: yup.string().required('partner.errors.id.required'),
  name: yup.string().required('partner.errors.name.required'),
});

// Schema para perfil de usuario
export const userProfileSchema = yup.object().shape({
  name: yup.string()
    .required('userProfile.errors.name.required')
    .min(minNameLength, 'userProfile.errors.name.min')
    .max(maxNameLength, 'userProfile.errors.name.max'),
  age: yup.number()
    .required('userProfile.errors.age.required')
    .positive('userProfile.errors.age.positive')
    .integer('userProfile.errors.age.integer')
    .min(minAge, 'userProfile.errors.age.min')
    .max(maxAge, 'userProfile.errors.age.max'),
  partners: yup.array()
    .of(partnerSchema)
    .optional(),
  actualPartner: yup.number()
    .integer('userProfile.errors.actualPartner.integer')
    .positive('userProfile.errors.actualPartner.positive')
    .optional(),
});

// Schema para crear nueva entrada
export const createEntrySchema = yup.object({
  activityType: yup.object({
    id: yup.string().required('Activity type is required'),
    name: yup.string().required(),
    icon: yup.string().required(),
    category: yup.string().required()
  }).required('Please select an activity type'),

  partner: yup.string()
    .trim()
    .max(maxPartnerNameLength, 'Partner name must be 50 characters or less')
    .optional(),

  duration: yup.number()
    .positive('Duration must be positive')
    .max(maxDuration, 'Duration cannot exceed 24 hours')
    .integer('Duration must be a whole number')
    .optional(),

  satisfaction: yup.number()
    .min(minSatisfaction, 'Satisfaction must be between 1 and 5')
    .max(maxSatisfaction, 'Satisfaction must be between 1 and 5')
    .integer('Satisfaction must be a whole number')
    .optional(),

  notes: yup.string()
    .trim()
    .max(maxNotesLength, 'Notes must be 500 characters or less')
    .optional(),

  date: yup.date()
    .max(new Date(), 'Date cannot be in the future')
    .required('Date is required')
});

// Schema para filtros de búsqueda
export const entryFiltersSchema = yup.object({
  startDate: yup.date().optional(),
  endDate: yup.date()
    .when('startDate', (startDate, schema) =>
      startDate ? schema.min(startDate, 'End date must be after start date') : schema
    )
    .optional(),

  activityTypes: yup.array()
    .of(yup.string().required())
    .optional(),

  minSatisfaction: yup.number()
    .min(1, 'Minimum satisfaction must be between 1 and 5')
    .max(5, 'Minimum satisfaction must be between 1 and 5')
    .integer()
    .optional(),

  partner: yup.string()
    .trim()
    .max(50, 'Partner name must be 50 characters or less')
    .optional()
});

export const userSettingsSchema = yup.object().shape({
  language: yup.string()
    .oneOf(['en', 'es'], 'Invalid language')
    .required('Language is required'),

  theme: yup.object({
    mode: yup.string()
      .oneOf(['light', 'dark', 'auto'], 'Invalid theme mode')
    ,
    primaryColor: yup.string().optional(),
    accentColor: yup.string().optional(),
  }),

  notifications: yup.object({
    enabled: yup.boolean().required(),
    reminderTime: yup.string()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .optional(),
    frequency: yup.string()
      .oneOf(['daily', 'weekly', 'never'], 'Invalid frequency')
      .optional()
  }),

  privacy: yup.object({
    requireAuth: yup.boolean().required(),
    authMethod: yup.string()
      .oneOf(['biometric', 'pin', 'pattern', 'none'], 'Invalid auth method') // Asegúrate de que este enum coincida
      .required(),
    autoLock: yup.boolean().optional(),
    autoLockTimeout: yup.number().optional()
      .min(30, 'Auto-lock timeout must be at least 30 seconds')
      .max(3600, 'Auto-lock timeout cannot exceed 1 hour')
    ,
    hideInRecents: yup.boolean().optional(),
    privateMode: yup.boolean().optional(), // Agrega este si existe en AppSettings
  }).required('Privacy settings are required'),

  // Agrega estos campos si AppSettings los tiene y quieres validarlos
  firstLaunch: yup.boolean().required('First launch status is required'),
  onboardingCompleted: yup.boolean().required('Onboarding completed status is required'),
  analyticsEnabled: yup.boolean().required('Analytics enabled status is required'),
});

// Schema para datos de importación
export const importDataSchema = yup.object({
  entries: yup.array()
    .of(yup.object({
      id: yup.string().required(),
      date: yup.date().required(),
      activityType: yup.object().required(),
      partner: yup.string().optional(),
      duration: yup.number().positive().optional(),
      satisfaction: yup.number().min(1).max(5).optional(),
      notes: yup.string().optional(),
      createdAt: yup.date().required(),
      updatedAt: yup.date().required()
    }))
    .required(),

  settings: yup.object().required(),
  user: yup.object().required(),
  metadata: yup.object({
    version: yup.string().required(),
    lastBackup: yup.date().optional(),
    dataHash: yup.string().required()
  }).required()
});

// Schema para onboarding
export const onboardingSchema = yup.object({
  profile: userProfileSchema,
  settings: userSettingsSchema,
})

// Tipos derivados de los schemas
export type CreateEntryFormData = yup.InferType<typeof createEntrySchema>;
export type EntryFiltersFormData = yup.InferType<typeof entryFiltersSchema>;
export type UserSettingsFormData = yup.InferType<typeof userSettingsSchema>;
export type ImportDataFormData = yup.InferType<typeof importDataSchema>;
export type UserProfileFormData = yup.InferType<typeof userProfileSchema>;
export type OnboardingFormData = yup.InferType<typeof onboardingSchema>;
