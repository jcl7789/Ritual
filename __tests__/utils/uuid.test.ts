import { generateUUID, generateShortId, generateTimestampId } from '../../src/utils/uuid';

describe('generateUUID', () => {
  it('should generate a valid UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  it('should generate unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });
});

describe('generateShortId', () => {
  it('should generate a string of 12 characters', () => {
    const id = generateShortId();
    expect(id).toHaveLength(12);
  });
  it('should generate unique short IDs', () => {
    const id1 = generateShortId();
    const id2 = generateShortId();
    expect(id1).not.toBe(id2);
  });
});

describe('generateTimestampId', () => {
  it('should generate an ID with timestamp and random part', () => {
    const id = generateTimestampId();
    expect(id).toMatch(/^[0-9a-z]+\-[0-9a-z]{6}$/i);
  });
  it('should generate unique timestamp IDs', () => {
    const id1 = generateTimestampId();
    const id2 = generateTimestampId();
    expect(id1).not.toBe(id2);
  });
});
