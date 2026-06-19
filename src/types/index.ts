// src/types/index.ts

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
}

export interface WatermarkData {
  coordinates: GPSCoordinates | null;
  address: string | null;          // null = still loading, "Null" = confirmed offline
  dateTime: string;
  label: string;                   // custom user tag
  isOnline: boolean;
}

export interface WatermarkSettings {
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  textColor: 'white' | 'black' | 'yellow';
  fontSize: 'small' | 'medium' | 'large';
  showDate: boolean;
  showTime: boolean;
  showCoordinates: boolean;
  showAddress: boolean;
  showLabel: boolean;
  backgroundOpacity: number;       // 0.0 to 1.0, semi-transparent bg behind text
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

export interface SavedTag {
  id: string;
  name: string;                    // e.g. "Site A", "Plot 7"
  coordinates: GPSCoordinates;
  address?: string;
  createdAt: number;               // timestamp
}

export interface GeoProofPhoto {
  id: string;
  uri: string;                     // local file path
  thumbnailUri?: string;
  watermarkData: WatermarkData;
  capturedAt: number;              // timestamp
  width: number;
  height: number;
  fileSize?: number;
}

export interface AppSettings {
  watermark: WatermarkSettings;
  theme: 'light' | 'dark' | 'system';
  addressLookupEnabled: boolean;
  coordinateFormat: 'DD';          // extensible later
  savedTags: SavedTag[];
}

export interface LicenseState {
  isLicensed: boolean;
  deviceId: string;
  activatedAt?: number;
}

// Navigation param lists
export type RootStackParamList = {
  License: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Camera: undefined;
  Gallery: undefined;
  Upload: undefined;
  Settings: undefined;
};

export type WatermarkEditParams = {
  photoUri: string;
  initialWatermark: WatermarkData;
  onSave: (data: WatermarkData) => void;
};
