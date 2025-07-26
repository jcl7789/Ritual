# Ritual

Ritual is a TypeScript-based application focused on secure data management. The project provides encrypted storage and backup solutions for user entries and settings. It leverages modern frontend frameworks and state management with Redux Toolkit, and is designed with extensibility and security in mind.

## Features

- **Encrypted Data Storage**: All user data (entries, settings, metadata) are securely encrypted using a custom encryption service and stored locally.
- **Entry Management**: Add, update, delete, and retrieve user entries.
- **Backup System**:
  - Create, restore, export, and import backups of your data.
  - Automatic backup scheduling (daily, weekly, monthly).
  - Metadata management for backups.
  - Cleanup of old backups.
- **Data Integrity**: Hashing and integrity checking on critical data to protect against tampering.
- **Error Handling**: Robust error management in all storage and backup operations.
- **Settings Management**: User can customize language, theme, and notification preferences.
- **Redux State Management**: Uses Redux Toolkit for managing application state, focusing on entries and statistics.

## Architecture

- **src/services/storage/**: Contains business logic for encrypted storage (`StorageService.ts`) and backup management (`BackupService.ts`).
- **src/hooks/**: Includes custom React hooks for storage operations (`useStorage.ts`).
- **src/store/**: Redux store and slices for entries and statistics.
- **Encryption**: All sensitive operations use an encryption service to ensure data privacy.
- **Backup Operations**: Uses async file system APIs to manage backup files and metadata, supporting sharing and document picking.

## Example Data Structure

```typescript
interface StoredData {
  entries: Entry[];
  settings: {
    language: string;
    theme: string;
    notifications: boolean;
  };
  user: {
    userId: string;
    createdAt: Date;
  };
  metadata: {
    version: string;
    dataHash: string;
    lastBackup?: Date;
  };
}
```

## Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Run**
   ```bash
   npm start
   ```

3. **Build**
   ```bash
   npm run build
   ```

## Usage

- Add new entries to your encrypted data store.
- Create a backup manually or schedule automatic backups.
- Restore data from a backup file.
- Export or import encrypted data for external backup.

## Contributing

No specific guidelines yet. Please open an issue or pull request for suggestions and changes.

## License

No license specified yet. All rights reserved to the author.

## Author

[jcl7789](https://github.com/jcl7789)

---