import {
  createEntrySchema,
  entryFiltersSchema,
  userSettingsSchema,
  importDataSchema,
  userProfileSchema,
  CreateEntryFormData,
  EntryFiltersFormData,
  UserSettingsFormData,
  UserProfileFormData
} from '../../schemas/validation';
import { ValidationError } from 'yup';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: ValidationErrors;
}

export interface ValidationErrors {
  [key: string]: string | ValidationErrors;
}

export class ValidationService {

   /**
   * Valida datos del perfil de usuario
   */
  static async validateUserProfile(data: any): Promise<ValidationResult<UserProfileFormData>> {
    try {
      const validData = await userProfileSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      return {
        isValid: true,
        data: validData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(error as ValidationError)
      };
    }
  }

  /**
   * Valida datos para crear nueva entrada
   */
  static async validateCreateEntry(data: any): Promise<ValidationResult<CreateEntryFormData>> {
    try {
      const validData = await createEntrySchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      return {
        isValid: true,
        data: validData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(error as ValidationError)
      };
    }
  }

  /**
   * Valida filtros de búsqueda
   */
  static async validateEntryFilters(data: any): Promise<ValidationResult<EntryFiltersFormData>> {
    try {
      const validData = await entryFiltersSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      return {
        isValid: true,
        data: validData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(error as ValidationError)
      };
    }
  }

  /**
   * Valida configuraciones de usuario
   */
  static async validateUserSettings(data: any): Promise<ValidationResult<UserSettingsFormData>> {
    try {
      const validData = await userSettingsSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      return {
        isValid: true,
        data: validData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(error as ValidationError)
      };
    }
  }

  /**
   * Valida datos de importación
   */
  static async validateImportData(data: any): Promise<ValidationResult<any>> {
    try {
      const validData = await importDataSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      // Validaciones adicionales específicas
      const additionalValidation = this.validateImportDataIntegrity(validData);
      if (!additionalValidation.isValid) {
        return additionalValidation;
      }

      return {
        isValid: true,
        data: validData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(error as ValidationError)
      };
    }
  }

  /**
   * Valida la integridad de datos de importación
   */
  private static validateImportDataIntegrity(data: any): ValidationResult<any> {
    const errors: ValidationErrors = {};

    // Verificar que las fechas sean coherentes
    data.entries.forEach((entry: any, index: number) => {
      if (entry.createdAt > entry.updatedAt) {
        errors[`entries.${index}.dates`] = 'Created date cannot be after updated date';
      }

      if (new Date(entry.date) > new Date()) {
        errors[`entries.${index}.date`] = 'Entry date cannot be in the future';
      }
    });

    // Verificar duplicados por ID
    const entryIds = data.entries.map((entry: any) => entry.id);
    const duplicateIds = entryIds.filter((id: string, index: number) =>
      entryIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      errors.duplicateEntries = `Duplicate entry IDs found: ${duplicateIds.join(', ')}`;
    }

    // Verificar versión de datos
    if (!this.isVersionCompatible(data.metadata.version)) {
      errors.version = 'Data version is not compatible with current app version';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Verifica compatibilidad de versión
   */
  private static isVersionCompatible(version: string): boolean {
    const supportedVersions = ['1.0.0', '1.0.1', '1.1.0'];
    return supportedVersions.includes(version);
  }

  /**
   * Formatea errores de Yup en estructura consistente
   */
  private static formatValidationErrors(error: ValidationError): ValidationErrors {
    const errors: ValidationErrors = {};

    if (error.inner && error.inner.length > 0) {
      error.inner.forEach((err) => {
        if (err.path) {
          this.setNestedError(errors, err.path, err.message);
        }
      });
    } else if (error.path) {
      this.setNestedError(errors, error.path, error.message);
    }

    return errors;
  }

  /**
   * Establece errores anidados en objeto
   */
  private static setNestedError(errors: ValidationErrors, path: string, message: string): void {
    const pathParts = path.split('.');
    let current = errors;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as ValidationErrors;
    }

    current[pathParts[pathParts.length - 1]] = message;
  }

  /**
   * Valida campo individual en tiempo real
   */
  static async validateField(
    fieldName: string,
    value: any,
    schema: any
  ): Promise<string | null> {
    try {
      await schema.validateAt(fieldName, { [fieldName]: value });
      return null;
    } catch (error) {
      return (error as ValidationError).message;
    }
  }

  /**
   * Sanitiza entrada de texto
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/[<>]/g, ''); // Remover caracteres potencialmente peligrosos
  }

  /**
   * Valida formato de email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida seguridad de contraseña
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else suggestions.push('Include special characters');

    return {
      isValid: score >= 3,
      score,
      suggestions
    };
  }

  /**
   * Valida datos antes del backup
   */
  static async validateBackupData(data: any): Promise<ValidationResult<any>> {
    // Verificar que los datos no estén corruptos
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: { data: 'Invalid backup data format' }
      };
    }

    // Verificar tamaño de datos
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 50 * 1024 * 1024) { // 50MB limit
      return {
        isValid: false,
        errors: { size: 'Backup data is too large (>50MB)' }
      };
    }

    return this.validateImportData(data);
  }
}
