// src/services/storage/StorageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Entry, CreateEntryInput } from '../../types/Entry';
import { User, UserProfile } from '../../types/User';

// Crear y exportar una instancia singleton del servicio
import { UserStats } from '../../types/User';
import { generateUUID } from '../../utils/uuid';

interface StoredData {
  entries: Entry[];
  settings: {
    language: string;
    theme: string;
    notifications: boolean;
  };
  user: {
    createdAt: Date;
    profile?: UserProfile; // Perfil de usuario opcional
  };
  metadata: {
    version: string;
    dataHash: string;
    lastBackup?: Date;
  };
}

class StorageServiceClass {
  private readonly STORAGE_KEY = 'ritual_data';
  private readonly SECRET_KEY = 'ritual_secret_key_2024';
  private readonly VERSION = '1.0.0';

  /**
   * Inicializa el almacenamiento si es la primera vez
   */
  async initializeStorage(): Promise<void> {
    try {
      const existingData = await this.getData();
      if (!existingData) {
        const initialData: StoredData = {
          entries: [],
          settings: {
            language: 'en',
            theme: 'light',
            notifications: true,
          },
          user: {
            createdAt: new Date(),
          },
          metadata: {
            version: this.VERSION,
            dataHash: this.generateDataHash([]),
          },
        };
        await this.saveData(initialData);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw new Error('Failed to initialize storage');
    }
  }

  /**
   * Encripta datos
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  /**
   * Desencripta datos
   */
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Genera hash de integridad para los datos
   */
  private generateDataHash(entries: Entry[]): string {
    const dataString = JSON.stringify(entries);
    return CryptoJS.SHA256(dataString).toString();
  }

  /**
   * Guarda datos encriptados en AsyncStorage
   */
  private async saveData(data: StoredData): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      const encryptedData = this.encrypt(jsonData);
      await AsyncStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save data');
    }
  }

  /**
   * Obtiene y desencripta datos de AsyncStorage
   */
  private async getData(): Promise<StoredData | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) return null;

      const decryptedData = this.decrypt(encryptedData);
      const data: StoredData = JSON.parse(decryptedData);
      
      // Convertir strings de fecha a objetos Date
      data.entries = data.entries.map(entry => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      }));

      return data;
    } catch (error) {
      console.error('Error getting data:', error);
      throw new Error('Failed to decrypt data. Data may be corrupted.');
    }
  }

  /**
   * Obtiene todas las entradas
   */
  async getEntries(): Promise<Entry[]> {
    try {
      const data = await this.getData();
      return data?.entries || [];
    } catch (error) {
      console.error('Error getting entries:', error);
      throw error;
    }
  }

  /**
   * Guarda una nueva entrada
   */
  async saveEntry(entryInput: CreateEntryInput): Promise<Entry> {
    try {
      const data = await this.getData();
      if (!data) throw new Error('Storage not initialized');

      const newEntry: Entry = {
        id: generateUUID(),
        ...entryInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      data.entries.push(newEntry);
      data.metadata.dataHash = this.generateDataHash(data.entries);

      await this.saveData(data);
      return newEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      throw new Error('Failed to save entry');
    }
  }

  /**
   * Actualiza una entrada existente
   */
  async updateEntry(entryId: string, updates: Partial<Entry>): Promise<Entry> {
    try {
      const data = await this.getData();
      if (!data) throw new Error('Storage not initialized');

      const entryIndex = data.entries.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) throw new Error('Entry not found');

      data.entries[entryIndex] = {
        ...data.entries[entryIndex],
        ...updates,
        updatedAt: new Date(),
      };

      data.metadata.dataHash = this.generateDataHash(data.entries);
      await this.saveData(data);

      return data.entries[entryIndex];
    } catch (error) {
      console.error('Error updating entry:', error);
      throw new Error('Failed to update entry');
    }
  }

  /**
   * Elimina una entrada
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const data = await this.getData();
      if (!data) throw new Error('Storage not initialized');

      const initialLength = data.entries.length;
      data.entries = data.entries.filter(entry => entry.id !== entryId);

      if (data.entries.length === initialLength) {
        throw new Error('Entry not found');
      }

      data.metadata.dataHash = this.generateDataHash(data.entries);
      await this.saveData(data);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw new Error('Failed to delete entry');
    }
  }

  /**
   * Calcula estadísticas del usuario
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const entries = await this.getEntries();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthEntries = entries.filter(entry => 
        new Date(entry.date) >= startOfMonth
      );

      const satisfactionScores = entries
        .filter(entry => entry.satisfaction)
        .map(entry => entry.satisfaction!);

      const averageSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : undefined;

      const lastActivity = entries.length > 0
        ? new Date(Math.max(...entries.map(entry => new Date(entry.date).getTime())))
        : undefined;

      // Actividad más común
      const activityCounts = entries.reduce((acc, entry) => {
        acc[entry.activityType.id] = (acc[entry.activityType.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonActivityId = Object.keys(activityCounts).reduce((a, b) => 
        activityCounts[a] > activityCounts[b] ? a : b, Object.keys(activityCounts)[0]
      );

      const mostCommonActivity = entries.find(entry => 
        entry.activityType.id === mostCommonActivityId
      )?.activityType;

      return {
        totalEntries: entries.length,
        thisMonth: thisMonthEntries.length,
        lastActivity,
        averageSatisfaction,
        mostCommonActivity,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      throw new Error('Failed to calculate statistics');
    }
  }

  /**
   * Crea un backup de los datos
   */
  async createBackup(): Promise<string> {
    try {
      const data = await this.getData();
      if (!data) throw new Error('No data to backup');

      data.metadata.lastBackup = new Date();
      await this.saveData(data);

      return this.encrypt(JSON.stringify(data));
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restaura datos desde un backup
   */
  async restoreFromBackup(encryptedBackup: string): Promise<void> {
    try {
      const decryptedData = this.decrypt(encryptedBackup);
      const backupData: StoredData = JSON.parse(decryptedData);

      // Validar estructura del backup
      if (!backupData.entries || !backupData.user || !backupData.metadata) {
        throw new Error('Invalid backup format');
      }

      // Verificar integridad
      const calculatedHash = this.generateDataHash(backupData.entries);
      if (calculatedHash !== backupData.metadata.dataHash) {
        console.warn('Backup integrity check failed, but proceeding with restoration');
      }

      await this.saveData(backupData);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup. Invalid or corrupted data.');
    }
  }

  /**
   * Exporta datos para compartir
   */
  async exportData(): Promise<string> {
    try {
      return await this.createBackup();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Importa datos desde texto encriptado
   */
  async importData(encryptedData: string): Promise<void> {
    try {
      await this.restoreFromBackup(encryptedData);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data. Please check the format.');
    }
  }

  /**
   * Limpia todos los datos (usar con precaución)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await this.initializeStorage();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Obtiene el perfil de usuario
   */
  async getUserProfile(): Promise<User | null> {
    try {
      const data = await this.getData();
      if (!data || !data.user) return null;
      const user = data.user;
      return {
        entries: data.entries || [],
        createdAt: user.createdAt,
        updatedAt: (user as any).updatedAt ?? undefined,
        profile: user.profile ?? {
          name: '',
          age: 0,
          partners: [], // Partner[] type
          actualPartner: 0,
          language: 'en',
        },
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Obtiene la configuración de usuario
   */
  async hasUserData(): Promise<boolean> {
    try {
      const data = await this.getData();
      return data?.user ? true : false;
    }
    catch (error) {
      console.error('Error checking user data:', error);
      throw new Error('Failed to check user data');
    }
  }

   async initializeUserProfile(userProfile: UserProfile) {
    try {
      const data = await this.getData();
      if (!data) throw new Error('Storage not initialized');

      // Verificar si ya existe un perfil de usuario
      if (data.user && data.user.profile) {
        console.warn('User profile already exists, skipping initialization');
        return;
      }

      // Crear un nuevo perfil de usuario
      data.user = {
        createdAt: new Date(),
        profile: {
          ...userProfile
        },
      };

      await this.saveData(data);
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw new Error('Failed to initialize user profile');
    }
  }
  /**
   * Obtiene datos por defecto
   */
  private static getDefaultData(): StoredData {
    return {
      entries: [],
      settings: {
        language: 'es',
        theme: 'light',
        notifications: true,
      },
      user: {
        createdAt: new Date(),
      },
      metadata: {
        version: StorageService.VERSION,
        dataHash: '',
      },
    };
  }

  /**
   * Valida la estructura de datos importados
   */
  private static validateDataStructure(data: any): boolean {
    return (
      data &&
      Array.isArray(data.entries) &&
      data.settings &&
      data.user &&
      data.metadata
    );
  }
}

export const StorageService = new StorageServiceClass(); 
