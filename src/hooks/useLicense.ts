// src/hooks/useLicense.ts
import {useState, useEffect, useCallback} from 'react';
import DeviceInfo from 'react-native-device-info';
import {LicenseState} from '../types';
import {storage} from '../utils/storage';
import {validateLicenseKey} from '../utils/licenseHash';

interface UseLicenseReturn {
  licenseState: LicenseState | null;
  isLicensed: boolean;
  deviceId: string;
  isChecking: boolean;
  activateLicense: (key: string) => Promise<{success: boolean; error?: string}>;
}

export function useLicense(): UseLicenseReturn {
  const [licenseState, setLicenseState] = useState<LicenseState | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function init() {
      const id = await DeviceInfo.getAndroidId();
      setDeviceId(id);

      const saved = await storage.getLicense();
      if (saved?.isLicensed) {
        setLicenseState(saved);
      }
      setIsChecking(false);
    }
    init();
  }, []);

  const activateLicense = useCallback(
    async (key: string): Promise<{success: boolean; error?: string}> => {
      if (!deviceId) {
        return {success: false, error: 'Could not read Device ID. Try restarting the app.'};
      }

      const isValid = validateLicenseKey(deviceId, key);
      if (!isValid) {
        return {success: false, error: 'Invalid license key. Please check and try again.'};
      }

      const state: LicenseState = {
        isLicensed: true,
        deviceId,
        activatedAt: Date.now(),
      };

      await storage.saveLicense(state);
      setLicenseState(state);
      return {success: true};
    },
    [deviceId],
  );

  return {
    licenseState,
    isLicensed: licenseState?.isLicensed ?? false,
    deviceId,
    isChecking,
    activateLicense,
  };
}
