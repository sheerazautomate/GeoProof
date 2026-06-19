// src/screens/LicenseScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useLicense} from '../hooks/useLicense';
import {APP_NAME, APP_VERSION} from '../constants/config';
import {FontSizes, FontWeights} from '../constants/fonts';

export function LicenseScreen({onActivated}: {onActivated: () => void}) {
  const {colors} = useTheme();
  const {deviceId, isChecking, activateLicense} = useLicense();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    if (!key.trim()) {
      setError('Please enter your license key.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await activateLicense(key.trim());
    setLoading(false);
    if (result.success) {
      Alert.alert('✅ Activated', 'GeoProof is now unlocked. Enjoy!', [
        {text: 'Continue', onPress: onActivated},
      ]);
    } else {
      setError(result.error ?? 'Activation failed.');
    }
  };

  const copyDeviceId = () => {
    Clipboard.setString(deviceId);
    Alert.alert('Copied', 'Device ID copied to clipboard.');
  };

  const s = styles(colors);

  if (isChecking) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled">
      {/* Logo area */}
      <View style={s.heroArea}>
        <View style={s.logoCircle}>
          <Text style={s.logoEmoji}>📍</Text>
        </View>
        <Text style={s.appName}>{APP_NAME}</Text>
        <Text style={s.tagline}>GPS Photo Stamping — Pro Edition</Text>
        <Text style={s.version}>v{APP_VERSION}</Text>
      </View>

      {/* Device ID card */}
      <View style={s.card}>
        <Text style={s.cardLabel}>YOUR DEVICE ID</Text>
        <Text style={s.deviceIdText} selectable>
          {deviceId || 'Reading...'}
        </Text>
        <TouchableOpacity style={s.copyBtn} onPress={copyDeviceId}>
          <Text style={s.copyBtnText}>📋  Copy Device ID</Text>
        </TouchableOpacity>
        <Text style={s.cardHint}>
          Send this ID to the developer to receive your license key.
        </Text>
      </View>

      {/* License key input */}
      <View style={s.card}>
        <Text style={s.cardLabel}>ENTER LICENSE KEY</Text>
        <TextInput
          style={s.input}
          value={key}
          onChangeText={v => {
            setKey(v);
            setError('');
          }}
          placeholder="Paste your license key here"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={3}
        />
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.activateBtn, loading && s.activateBtnDisabled]}
          onPress={handleActivate}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.activateBtnText}>Activate GeoProof</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>
        This is a one-time activation tied to your device.{'\n'}
        Contact support if you change your device.
      </Text>
    </ScrollView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    content: {padding: 24, paddingBottom: 48},
    centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},

    heroArea: {alignItems: 'center', marginTop: 32, marginBottom: 28},
    logoCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.primarySurface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    logoEmoji: {fontSize: 40},
    appName: {
      fontSize: FontSizes.xxxl,
      fontWeight: FontWeights.extrabold,
      color: colors.primary,
      letterSpacing: 1,
    },
    tagline: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
      marginTop: 4,
    },
    version: {fontSize: FontSizes.sm, color: colors.textMuted, marginTop: 2},

    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLabel: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    deviceIdText: {
      fontSize: FontSizes.sm,
      color: colors.textPrimary,
      fontFamily: 'monospace',
      backgroundColor: colors.surfaceElevated,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    copyBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySurface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    copyBtnText: {
      color: colors.primary,
      fontWeight: FontWeights.semibold,
      fontSize: FontSizes.sm,
    },
    cardHint: {
      fontSize: FontSizes.xs,
      color: colors.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },

    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      color: colors.textPrimary,
      fontSize: FontSizes.sm,
      fontFamily: 'monospace',
      backgroundColor: colors.surfaceElevated,
      marginBottom: 10,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      color: colors.error,
      fontSize: FontSizes.sm,
      marginBottom: 10,
    },
    activateBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    activateBtnDisabled: {opacity: 0.6},
    activateBtnText: {
      color: '#fff',
      fontWeight: FontWeights.bold,
      fontSize: FontSizes.md,
      letterSpacing: 0.5,
    },

    footer: {
      textAlign: 'center',
      fontSize: FontSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
      marginTop: 8,
    },
  });
