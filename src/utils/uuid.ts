/**
 * Genera un UUID v4 simple sin dependencias externas
 * Funciona en React Native y navegadores
 */
export function generateUUID(): string {
  // Template for UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Genera un ID más corto para uso interno (12 caracteres)
 */
export function generateShortId(): string {
  let id = Math.random().toString(36).substring(2, 14);
  if (id.length < 12) {
    id = id.padEnd(12, '0');
  }
  return id;
}

/**
 * Genera un ID basado en timestamp + random para mayor unicidad
 */
export function generateTimestampId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}
