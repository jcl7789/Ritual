// src/services/storage/BackupService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from './EncryptionService';
import { StorageService } from './StorageService';
import { ValidationService } from '../validation/ValidationService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  version: string;
  platform: string;
  entriesCount: number;
  fileSize: number;
  encrypted: boolean;
}

export interface BackupConfig {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  cloudSync: boolean;
  compressionEnabled: boolean;
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  metadata?: BackupMetadata;
  error?: string;
}

export class BackupService {
  private static readonly BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
  private static readonly BACKUP_METADATA_KEY = 'backup_metadata';
  private static readonly AUTO_BACKUP_KEY = 'auto_backup_config';

  /**
   * Inicializa el directorio de backups
   */
  static async initializeBackupSystem(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing backup system:', error);
      throw new Error('Failed to initialize backup system');
    }
  }

  /**
   * Crea un backup completo
   */
  static async createFullBackup(
    includeSettings: boolean = true,
    compress: boolean = true
  ): Promise<BackupResult> {
    console.log('Creating full backup...', includeSettings, compress);
    try {
      await this.initializeBackupSystem();
      
      const data = await StorageService.loadData();
      
      // Validar datos antes del backup
      const validation = await ValidationService.validateBackupData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid backup data: ${JSON.stringify(validation.errors)}`
        };
      }

      // Preparar datos del backup
      const backupData = {
        ...data,
        backupMetadata: {
          id: this.generateBackupId(),
          createdAt: new Date(),
          version: '1.0.0',
          platform: 'mobile',
          entriesCount: data.entries.length,
          encrypted: true
        }
      };

      // Cifrar datos
      const encryptedData = EncryptionService.encrypt(backupData);
      
      // Comprimir si está habilitado
      const finalData = compress ? await this.compressData(encryptedData) : encryptedData;
      
      // Generar nombre del archivo
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ritual_backup_${timestamp}_${backupData.backupMetadata.id.substring(0, 8)}.rbk`;
      const filePath = `${this.BACKUP_DIR}${filename}`;

      // Guardar archivo
      await FileSystem.writeAsStringAsync(filePath, finalData, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Obtener información del archivo
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const metadata: BackupMetadata = {
        ...backupData.backupMetadata,
        fileSize: fileInfo.exists && 'size' in fileInfo ? (fileInfo.size as number) : 0
      };

      // Guardar metadata del backup
      await this.saveBackupMetadata(metadata, filePath);

      // Limpiar backups antiguos
      await this.cleanupOldBackups();

      return {
        success: true,
        filePath,
        metadata
      };

    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown backup error'
      };
    }
  }

  /**
   * Restaura un backup desde archivo
   */
  static async restoreBackup(filePath: string): Promise<BackupResult> {
    try {
      // Leer archivo
      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Descomprimir si es necesario
      const decompressedData = await this.decompressData(fileContent);
      
      // Descifrar datos
      const decryptedData = EncryptionService.decrypt(decompressedData);
      
      // Validar estructura de datos
      const validation = await ValidationService.validateImportData(decryptedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid backup format: ${JSON.stringify(validation.errors)}`
        };
      }

      // Crear backup de datos actuales antes de restaurar
      await this.createFullBackup(true, true);

      // Restaurar datos
      await StorageService.saveData(decryptedData);

      return {
        success: true,
        metadata: decryptedData.backupMetadata
      };

    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown restore error'
      };
    }
  }

  /**
   * Exporta backup para compartir
   */
  static async exportBackup(): Promise<BackupResult> {
    try {
      const backupResult = await this.createFullBackup(true, true);
      
      if (!backupResult.success || !backupResult.filePath) {
        return backupResult;
      }

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupResult.filePath, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Export Ritual Backup'
        });
      }

      return backupResult;

    } catch (error) {
      console.error('Error exporting backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Importa backup desde archivo externo
   */
  static async importBackup(): Promise<BackupResult> {
    try {
      // Seleccionar archivo
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', '*/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets[0]) {
        return {
          success: false,
          error: 'No file selected'
        };
      }

      const file = result.assets[0];
      
      // Validar extensión
      if (!file.name.endsWith('.rbk')) {
        return {
          success: false,
          error: 'Invalid backup file format. Please select a .rbk file.'
        };
      }

      return await this.restoreBackup(file.uri);

    } catch (error) {
      console.error('Error importing backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Configura backup automático
   */
  static async configureAutoBackup(config: BackupConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTO_BACKUP_KEY, JSON.stringify(config));
      
      if (config.autoBackup) {
        await this.scheduleNextBackup(config.frequency);
      } else {
        await this.cancelScheduledBackup();
      }
    } catch (error) {
      console.error('Error configuring auto backup:', error);
      throw new Error('Failed to configure auto backup');
    }
  }

  /**
   * Obtiene configuración de backup automático
   */
  static async getAutoBackupConfig(): Promise<BackupConfig> {
    try {
      const configString = await AsyncStorage.getItem(this.AUTO_BACKUP_KEY);
      if (configString) {
        return JSON.parse(configString);
      }
      
      // Configuración por defecto
      return {
        autoBackup: false,
        frequency: 'weekly',
        maxBackups: 5,
        cloudSync: false,
        compressionEnabled: true
      };
    } catch (error) {
      console.error('Error getting auto backup config:', error);
      return {
        autoBackup: false,
        frequency: 'weekly',
        maxBackups: 5,
        cloudSync: false,
        compressionEnabled: true
      };
    }
  }

  /**
   * Lista todos los backups disponibles
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      await this.initializeBackupSystem();
      
      const files = await FileSystem.readDirectoryAsync(this.BACKUP_DIR);
      const backupFiles = files.filter(file => file.endsWith('.rbk'));
      
      const metadataList: BackupMetadata[] = [];
      
      for (const file of backupFiles) {
        try {
          const filePath = `${this.BACKUP_DIR}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          // Intentar obtener metadata del archivo
          const metadata = await this.extractBackupMetadata(filePath);
          if (metadata) {
            metadataList.push({
              ...metadata,
              fileSize: fileInfo.exists && 'size' in fileInfo ? (fileInfo.size as number) : 0
            });
          }
        } catch (error) {
          console.warn(`Could not read metadata for backup ${file}:`, error);
        }
      }

      return metadataList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Elimina un backup específico
   */
  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        return false;
      }

      const filePath = `${this.BACKUP_DIR}ritual_backup_${backup.createdAt.toISOString().split('T')[0]}_${backup.id.substring(0, 8)}.rbk`;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  /**
   * Comprime datos usando base64
   */
  private static async compressData(data: string): Promise<string> {
    // Implementación simple de compresión
    // En una implementación real, podrías usar una biblioteca de compresión
    try {
      return btoa(data);
    } catch (error) {
      console.warn('Compression failed, using original data');
      console.error('Compression error:', error);
      return data;
    }
  }

  /**
   * Descomprime datos
   */
  private static async decompressData(data: string): Promise<string> {
    try {
      return atob(data);
    } catch (error) {
      // Si falla la descompresión, asumir que no está comprimido
        console.warn('Decompression failed, using original data', error);
      return data;
    }
  }

  /**
   * Genera ID único para backup
   */
  private static generateBackupId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guarda metadata del backup
   */
  private static async saveBackupMetadata(
    metadata: BackupMetadata, 
    filePath: string
  ): Promise<void> {
    try {
      const existingMetadata = await AsyncStorage.getItem(this.BACKUP_METADATA_KEY);
      const metadataList = existingMetadata ? JSON.parse(existingMetadata) : [];
      
      metadataList.push({ ...metadata, filePath });
      
      await AsyncStorage.setItem(
        this.BACKUP_METADATA_KEY, 
        JSON.stringify(metadataList)
      );
    } catch (error) {
      console.error('Error saving backup metadata:', error);
    }
  }

  /**
   * Extrae metadata de un archivo de backup
   */
  private static async extractBackupMetadata(filePath: string): Promise<BackupMetadata | null> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      const decompressedData = await this.decompressData(fileContent);
      const decryptedData = EncryptionService.decrypt(decompressedData);
      
      return decryptedData.backupMetadata || null;
    } catch (error) {
      console.error('Error extracting backup metadata:', error);
      return null;
    }
  }

  /**
   * Limpia backups antiguos según configuración
   */
  private static async cleanupOldBackups(): Promise<void> {
    try {
      const config = await this.getAutoBackupConfig();
      const backups = await this.listBackups();
      
      if (backups.length > config.maxBackups) {
        const backupsToDelete = backups.slice(config.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  /**
   * Programa el siguiente backup automático
   */
  private static async scheduleNextBackup(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    // Esta función dependería de una implementación de scheduling
    // Por ejemplo, usando expo-task-manager o expo-background-task
    console.log(`Scheduling next backup with frequency: ${frequency}`);
  }

  /**
   * Cancela backup automático programado
   */
  private static async cancelScheduledBackup(): Promise<void> {
    console.log('Cancelling scheduled backup');
    // Implementar cancelación de tareas programadas
  }
}