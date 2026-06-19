// src/components/LicenseGuard.tsx
import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useLicense} from '../hooks/useLicense';
import {LicenseScreen} from '../screens/LicenseScreen';
import {useTheme} from '../context/ThemeContext';

interface Props {
  children: React.ReactNode;
}

export function LicenseGuard({children}: Props) {
  const {isLicensed, isChecking} = useLicense();
  const {colors} = useTheme();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (isLicensed) setUnlocked(true);
  }, [isLicensed]);

  if (isChecking) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!unlocked) {
    return <LicenseScreen onActivated={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
