import CryptoJS from 'crypto-js';

/**
 * Encrypts sensitive data using AES encryption
 * @param data - The data to encrypt (will be JSON stringified)
 * @param key - Encryption key (should be stored in env variable)
 * @returns Encrypted string
 */
export function encryptData(data: any, key: string): string {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
  return encrypted;
}

/**
 * Decrypts data that was encrypted with encryptData
 * @param encryptedData - The encrypted string
 * @param key - Encryption key (must match the one used for encryption)
 * @returns Decrypted and parsed data
 */
export function decryptData<T = any>(encryptedData: string, key: string): T {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
  const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString);
}

/**
 * Gets the encryption key from environment variables
 * Throws error if not configured
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not configured');
  }
  return key;
}
