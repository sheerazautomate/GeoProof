// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings, GeoProofPhoto, LicenseState} from '../types';
import {STORAGE_KEYS} from '../constants/config';

async function get<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage.set error:', e);
  }
}

async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export const storage = {
  // License
  getLicense: () => get<LicenseState>(STORAGE_KEYS.LICENSE),
  saveLicense: (license: LicenseState) => set(STORAGE_KEYS.LICENSE, license),
  clearLicense: () => remove(STORAGE_KEYS.LICENSE),

  // Settings
  getSettings: () => get<AppSettings>(STORAGE_KEYS.SETTINGS),
  saveSettings: (settings: AppSettings) =>
    set(STORAGE_KEYS.SETTINGS, settings),

  // Photos index
  getPhotos: () => get<GeoProofPhoto[]>(STORAGE_KEYS.PHOTOS),
  savePhotos: (photos: GeoProofPhoto[]) => set(STORAGE_KEYS.PHOTOS, photos),

  async addPhoto(photo: GeoProofPhoto): Promise<void> {
    const existing = (await this.getPhotos()) ?? [];
    await this.savePhotos([photo, ...existing]);
  },

  async deletePhoto(id: string): Promise<void> {
    const existing = (await this.getPhotos()) ?? [];
    await this.savePhotos(existing.filter(p => p.id !== id));
  },

  async clearAll(): Promise<void> {
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key)),
    );
  },
};
