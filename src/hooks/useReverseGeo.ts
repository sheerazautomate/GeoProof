// src/hooks/useReverseGeo.ts
import {useState, useEffect, useRef} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {GPSCoordinates} from '../types';
import {NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT} from '../constants/config';

interface UseReverseGeoReturn {
  address: string | null;   // null = loading, "Null" = offline/failed
  isLoading: boolean;
  isOnline: boolean;
}

/**
 * Fetches a human-readable address from GPS coordinates via Nominatim.
 * Returns "Null" string (as spec'd) if offline or lookup fails.
 * Only fires when enabled === true and coordinates change meaningfully.
 */
export function useReverseGeo(
  coordinates: GPSCoordinates | null,
  enabled: boolean,
): UseReverseGeoReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const lastFetchKey = useRef<string>('');

  // Monitor connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!coordinates || !enabled) {
      if (!enabled) setAddress('Null');
      return;
    }

    // Round to 4 decimal places to avoid refetching on micro-movements
    const lat = parseFloat(coordinates.latitude.toFixed(4));
    const lng = parseFloat(coordinates.longitude.toFixed(4));
    const fetchKey = `${lat},${lng}`;

    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;

    // Check connectivity before attempting
    NetInfo.fetch().then(state => {
      if (!state.isConnected || !state.isInternetReachable) {
        setAddress('Null');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setAddress(null);

      const url =
        `${NOMINATIM_BASE_URL}?format=json&lat=${lat}&lon=${lng}` +
        `&zoom=18&addressdetails=1`;

      fetch(url, {
        headers: {'User-Agent': NOMINATIM_USER_AGENT},
      })
        .then(res => res.json())
        .then(data => {
          if (data?.display_name) {
            // Shorten: take first 3 meaningful parts
            const parts = (data.display_name as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
              .slice(0, 4)
              .join(', ');
            setAddress(parts);
          } else {
            setAddress('Null');
          }
        })
        .catch(() => {
          setAddress('Null');
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }, [coordinates, enabled]);

  return {address, isLoading, isOnline};
}
