// App.tsx
import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {SettingsProvider} from './src/context/SettingsContext';
import {LicenseGuard} from './src/components/LicenseGuard';
import {AppNavigator} from './src/navigation/AppNavigator';

function Root() {
  const {isDark, colors} = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <LicenseGuard>
        <AppNavigator />
      </LicenseGuard>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Root />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
