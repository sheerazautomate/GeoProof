// src/hooks/useGPS.ts
import {useState, useEffect, useRef, useCallback} from 'react';
import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform} from 'react-native';
import {GPSCoordinates} from '../types';
import {
  GPS_TIMEOUT_MS,
  GPS_MAX_AGE_MS,
  GPS_DISTANCE_FILTER,
} from '../constants/config';

export type GPSStatus = 'acquiring' | 'good' | 'fair' | 'none' | 'denied';

interface UseGPSReturn {
  coordinates: GPSCoordinates | null;
  status: GPSStatus;
  accuracy: number | null;
  requestPermission: () => Promise<boolean>;
  refresh: () => void;
}

export function useGPS(): UseGPSReturn {
  const [coordinates, setCoordinates] = useState<GPSCoordinates | null>(null);
  const [status, setStatus] = useState<GPSStatus>('acquiring');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchId = useRef<number | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'GeoProof needs location access',
        message:
          'GeoProof uses your GPS coordinates to stamp photos with accurate location data.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const startWatching = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
    }

    const watchOptions = {
      accuracy: {android: 'high'},
      timeout: GPS_TIMEOUT_MS,
      maximumAge: GPS_MAX_AGE_MS,
      distanceFilter: GPS_DISTANCE_FILTER,
      forceRequestLocation: true,
      showLocationDialog: true,
    } as any;

    watchId.current = Geolocation.watchPosition(
      position => {
        const {latitude, longitude, accuracy: acc, altitude} = position.coords;
        setCoordinates({latitude, longitude, accuracy: acc, altitude});
        setAccuracy(acc);

        // Classify signal quality
        if (acc <= 20) setStatus('good');
        else if (acc <= 60) setStatus('fair');
        else setStatus('fair');
      },
      error => {
        console.warn('GPS error:', error.code, error.message);
        if (error.code === 1) {
          setStatus('denied');
        } else {
          setStatus('none');
        }
        setCoordinates(null);
      },
      watchOptions,
    );
  }, []);

  const refresh = useCallback(() => {
    setStatus('acquiring');
    setCoordinates(null);
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const permitted = await requestPermission();
      if (!mounted) return;
      if (!permitted) {
        setStatus('denied');
        return;
      }
      startWatching();
    }

    init();

    return () => {
      mounted = false;
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, [requestPermission, startWatching]);

  return {coordinates, status, accuracy, requestPermission, refresh};
}
