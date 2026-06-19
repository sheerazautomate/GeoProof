// src/utils/licenseHash.ts
// Uses react-native-quick-crypto for SHA-256 hashing on-device (no network needed)
import {createHash} from 'react-native-quick-crypto';
import {LICENSE_SALT} from '../constants/config';

/**
 * Generates the expected license key for a given device ID.
 * Key = SHA-256( deviceId + LICENSE_SALT ) as lowercase hex string.
 *
 * This same logic must be replicated in the HTML key generator tool.
 */
export function generateLicenseKey(deviceId: string): string {
  const input = deviceId + LICENSE_SALT;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Validates a user-entered key against the device ID.
 */
export function validateLicenseKey(deviceId: string, enteredKey: string): boolean {
  const expected = generateLicenseKey(deviceId);
  // Case-insensitive comparison, also trim whitespace in case user has copy-paste artifacts
  return expected.toLowerCase() === enteredKey.trim().toLowerCase();
}
