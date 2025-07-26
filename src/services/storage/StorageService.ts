import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from './EncryptionService';
import { Entry } from '../../types/Entry';
import { User, UserStats } from '../../types/User';

export interface StoredData {
  entries: Entry[];
  settings: {
    language: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  user: {
    userId: string;
    createdAt: Date;
  };
  metadata: {
    version: string;
    lastBackup?: Date;
    dataHash: string;
  };
}

export class StorageService {
  private static readonly STORAGE_KEY = 'ritual_encrypted_data';
  private static readonly BACKUP_KEY = 'ritual_backup_data';
  private static readonly VERSION = '1.0.0';

  /**
   * Guarda todos los datos cifrados
   */
  static async saveData(data: Partial<StoredData>): Promise<void> {
    try {
      const existingData = await this.loadData();
      const updatedData: StoredData = {
        ...existingData,
        ...data,
        metadata: {
          ...existingData.metadata,
          version: this.VERSION,
          dataHash: EncryptionService.generateHash(JSON.stringify({
            entries: data.entries || existingData.entries,
            settings: data.settings || existingData.settings,
            user: data.user || existingData.user,
          })),
        },
      };

      const encryptedData = EncryptionService.encrypt(updatedData);
      await AsyncStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save data');
    }
  }

  /**
   * Carga todos los datos descifrados
   */
  static async loadData(): Promise<StoredData> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedData) {
        return this.getDefaultData();
      }

      const decryptedData = EncryptionService.decrypt(encryptedData);
      
      // Verificar integridad de datos
      const currentHash = EncryptionService.generateHash(JSON.stringify({
        entries: decryptedData.entries,
        settings: decryptedData.settings,
        user: decryptedData.user,
      }));

      if (!EncryptionService.verifyIntegrity(JSON.stringify({
        entries: decryptedData.entries,
        settings: decryptedData.settings,
        user: decryptedData.user,
      }), decryptedData.metadata.dataHash)) {
        console.warn('Data integrity check failed, using backup or default data');
        return await this.loadBackupData() || this.getDefaultData();
      }

      return decryptedData;
    } catch (error) {
      console.error('Error loading data:', error);
      // Intentar cargar backup
      const backupData = await this.loadBackupData();
      return backupData || this.getDefaultData();
    }
  }

  /**
   * Guarda una entrada específica
   */
  static async saveEntry(entry: Entry): Promise<void> {
    const data = await this.loadData();
    const existingIndex = data.entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      data.entries[existingIndex] = entry;
    } else {
      data.entries.unshift(entry);
    }

    await this.saveData({ entries: data.entries });
  }

  /**
   * Elimina una entrada específica
   */
  static async deleteEntry(entryId: string): Promise<void> {
    const data = await this.loadData();
    data.entries = data.entries.filter(entry => entry.id !== entryId);
    await this.saveData({ entries: data.entries });
  }

  /**
   * Obtiene todas las entradas
   */
  static async getEntries(): Promise<Entry[]> {
    const data = await this.loadData();
    return data.entries;
  }

  /**
   * Crea un backup de los datos
   */
  static async createBackup(): Promise<void> {
    try {
      const currentData = await this.loadData();
      currentData.metadata.lastBackup = new Date();
      
      const encryptedBackup = EncryptionService.encrypt(currentData);
      await AsyncStorage.setItem(this.BACKUP_KEY, encryptedBackup);
      
      // Actualizar fecha de backup en datos principales
      await this.saveData(currentData);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Carga datos desde backup
   */
  static async loadBackupData(): Promise<StoredData | null> {
    try {
      const encryptedBackup = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!encryptedBackup) return null;
      
      return EncryptionService.decrypt(encryptedBackup);
    } catch (error) {
      console.error('Error loading backup data:', error);
      return null;
    }
  }

  /**
   * Exporta datos para backup externo
   */
  static async exportData(): Promise<string> {
    const data = await this.loadData();
    return EncryptionService.encrypt(data);
  }

  /**
   * Importa datos desde backup externo
   */
  static async importData(encryptedData: string): Promise<void> {
    try {
      const importedData = EncryptionService.decrypt(encryptedData);
      
      // Validar estructura de datos
      if (!this.validateDataStructure(importedData)) {
        throw new Error('Invalid data structure');
      }

      await this.saveData(importedData);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Limpia todos los datos (para reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.BACKUP_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
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
        userId: `user_${Date.now()}`,
        createdAt: new Date(),
      },
      metadata: {
        version: this.VERSION,
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