// src/constants/config.ts
// ⚠️  REPLACE LICENSE_SALT before building your release APK.
//     Never commit your real salt to any public repository.

export const LICENSE_SALT = '@3r5$7h5';

export const APP_NAME = 'GeoProof';
export const APP_VERSION = '1.0.0';
export const PACKAGE_NAME = 'com.geoproof';

// Nominatim reverse geocoding (free, no API key needed)
// Please respect their usage policy: max 1 req/sec, set a real User-Agent
export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
export const NOMINATIM_USER_AGENT = 'GeoProof/1.0.0';

// Image output settings
export const IMAGE_QUALITY = 0.80;           // 80% JPEG compression
export const IMAGE_MAX_DIMENSION = 2048;     // px — scale down if larger
export const IMAGE_TARGET_MIN_MB = 1.0;
export const IMAGE_TARGET_MAX_MB = 2.0;

// GPS settings
export const GPS_TIMEOUT_MS = 10000;
export const GPS_MAX_AGE_MS = 5000;
export const GPS_DISTANCE_FILTER = 5;        // meters

// AsyncStorage keys
export const STORAGE_KEYS = {
  LICENSE: '@geoproof/license',
  SETTINGS: '@geoproof/settings',
  PHOTOS: '@geoproof/photos',
  SAVED_TAGS: '@geoproof/saved_tags',
} as const;

// Default watermark settings
export const DEFAULT_WATERMARK_SETTINGS = {
  position: 'bottom-left' as const,
  textColor: 'white' as const,
  fontSize: 'medium' as const,
  showDate: true,
  showTime: true,
  showCoordinates: true,
  showAddress: true,
  showLabel: false,
  backgroundOpacity: 0.55,
  dateFormat: 'DD/MM/YYYY' as const,
  timeFormat: '24h' as const,
};

export const DEFAULT_APP_SETTINGS = {
  watermark: DEFAULT_WATERMARK_SETTINGS,
  theme: 'system' as const,
  addressLookupEnabled: true,
  coordinateFormat: 'DD' as const,
  savedTags: [],
  saveLocation: 'app-private' as const,
  saveBackend: 'rnfs' as const,
};
