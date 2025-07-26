import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = 'ritual_app_secret_key_2024'; // En producción, usar una clave más segura

  /**
   * Cifra datos en formato Base64
   */
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.ENCRYPTION_KEY).toString();
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encrypted));
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Descifra datos desde formato Base64
   */
  static decrypt(encryptedBase64: string): any {
    try {
      const encryptedData = CryptoJS.enc.Base64.parse(encryptedBase64).toString(CryptoJS.enc.Utf8);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Genera un hash para verificar integridad
   */
  static generateHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Verifica la integridad de los datos
   */
  static verifyIntegrity(data: string, hash: string): boolean {
    return this.generateHash(data) === hash;
  }
}
