import { useState } from 'react';
import { StorageService } from '../services/storage/StorageService';
import { Entry } from '../types/Entry';

export const useStorage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveEntry = async (entry: Entry): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await StorageService.saveEntry(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await StorageService.deleteEntry(entryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (): Promise<Entry[]> => {
    setLoading(true);
    setError(null);
    try {
      const entries = await StorageService.getEntries();
      return entries;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await StorageService.createBackup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const exportedData = await StorageService.exportData();
      return exportedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importData = async (encryptedData: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await StorageService.importData(encryptedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveEntry,
    deleteEntry,
    loadEntries,
    createBackup,
    exportData,
    importData,
    loading,
    error,
  };
};