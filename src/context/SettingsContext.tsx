// src/context/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {AppSettings, SavedTag, WatermarkSettings} from '../types';
import {storage} from '../utils/storage';
import {DEFAULT_APP_SETTINGS} from '../constants/config';

interface SettingsContextValue {
  settings: AppSettings;
  updateWatermarkSettings: (patch: Partial<WatermarkSettings>) => Promise<void>;
  updateAppSettings: (patch: Partial<AppSettings>) => Promise<void>;
  addSavedTag: (tag: SavedTag) => Promise<void>;
  updateSavedTag: (tag: SavedTag) => Promise<void>;
  deleteSavedTag: (id: string) => Promise<void>;
  setAddressLookup: (enabled: boolean) => Promise<void>;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_APP_SETTINGS,
  updateWatermarkSettings: async () => {},
  updateAppSettings: async () => {},
  addSavedTag: async () => {},
  updateSavedTag: async () => {},
  deleteSavedTag: async () => {},
  setAddressLookup: async () => {},
  isLoaded: false,
});

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getSettings().then(saved => {
      if (saved) {
        setSettings({...DEFAULT_APP_SETTINGS, ...saved});
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback(async (updated: AppSettings) => {
    setSettings(updated);
    await storage.saveSettings(updated);
  }, []);

  const updateWatermarkSettings = useCallback(
    async (patch: Partial<WatermarkSettings>) => {
      const updated = {
        ...settings,
        watermark: {...settings.watermark, ...patch},
      };
      await save(updated);
    },
    [settings, save],
  );

  const addSavedTag = useCallback(
    async (tag: SavedTag) => {
      const updated = {
        ...settings,
        savedTags: [...settings.savedTags, tag],
      };
      await save(updated);
    },
    [settings, save],
  );

  const updateSavedTag = useCallback(
    async (tag: SavedTag) => {
      const updated = {
        ...settings,
        savedTags: settings.savedTags.map(t => (t.id === tag.id ? tag : t)),
      };
      await save(updated);
    },
    [settings, save],
  );

  const deleteSavedTag = useCallback(
    async (id: string) => {
      const updated = {
        ...settings,
        savedTags: settings.savedTags.filter(t => t.id !== id),
      };
      await save(updated);
    },
    [settings, save],
  );

  const updateAppSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = {...settings, ...patch};
      await save(updated);
    },
    [settings, save],
  );

  const setAddressLookup = useCallback(
    async (enabled: boolean) => {
      await updateAppSettings({addressLookupEnabled: enabled});
    },
    [updateAppSettings],
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateWatermarkSettings,
        updateAppSettings,
        addSavedTag,
        updateSavedTag,
        deleteSavedTag,
        setAddressLookup,
        isLoaded,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
