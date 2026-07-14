// src/components/CoordEditModal.tsx
import React, {useState, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {WatermarkData, WatermarkSettings} from '../types';
import {FontSizes, FontWeights} from '../constants/fonts';
import {buildWatermarkLines} from '../utils/watermarkBuilder';

interface Props {
  visible: boolean;
  watermarkData: WatermarkData;
  settings: WatermarkSettings;
  onSave: (data: WatermarkData, settings: WatermarkSettings) => void;
  onCancel: () => void;
}

// ── Stable sub-components (defined outside parent) to prevent keyboard dismiss ──

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  colors: any;
}

const FieldRow = React.memo(
  ({label, value, onChangeText, placeholder, keyboardType = 'default', colors}: FieldRowProps) => (
    <View style={fieldRowStyles(colors).fieldRow}>
      <Text style={fieldRowStyles(colors).fieldLabel}>{label}</Text>
      <TextInput
        style={fieldRowStyles(colors).fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  ),
);

const fieldRowStyles = (colors: any) =>
  StyleSheet.create({
    fieldRow: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    fieldLabel: {
      fontSize: FontSizes.xs,
      color: colors.textMuted,
      fontWeight: FontWeights.medium,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    fieldInput: {
      fontSize: FontSizes.md,
      color: colors.textPrimary,
      padding: 0,
    },
  });

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}

const ToggleRow = React.memo(({label, value, onChange, colors}: ToggleRowProps) => (
  <View style={toggleStyles(colors).toggleRow}>
    <Text style={toggleStyles(colors).toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{false: colors.border, true: colors.primaryLight}}
      thumbColor={value ? colors.primary : colors.textMuted}
    />
  </View>
));

const toggleStyles = (colors: any) =>
  StyleSheet.create({
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    toggleLabel: {
      fontSize: FontSizes.md,
      color: colors.textPrimary,
    },
  });

// ── Watermark Preview ────────────────────────────────────────────────────────

interface PreviewProps {
  watermarkData: WatermarkData;
  settings: WatermarkSettings;
  colors: any;
}

const WatermarkPreview = React.memo(({watermarkData, settings, colors}: PreviewProps) => {
  const lines = buildWatermarkLines(watermarkData, settings);

  const textColor =
    settings.textColor === 'white'
      ? '#FFFFFF'
      : settings.textColor === 'black'
      ? '#111111'
      : '#FFE500';

  const fontSize =
    settings.fontSize === 'small' ? 11 : settings.fontSize === 'large' ? 16 : 13;

  const positionStyle: any = {};
  switch (settings.position) {
    case 'bottom-left':
      positionStyle.bottom = 10;
      positionStyle.left = 10;
      break;
    case 'bottom-right':
      positionStyle.bottom = 10;
      positionStyle.right = 10;
      positionStyle.alignItems = 'flex-end';
      break;
    case 'top-left':
      positionStyle.top = 10;
      positionStyle.left = 10;
      break;
    case 'top-right':
      positionStyle.top = 10;
      positionStyle.right = 10;
      positionStyle.alignItems = 'flex-end';
      break;
  }

  return (
    <View style={previewStyles.wrapper}>
      <Text style={[previewStyles.previewLabel, {color: colors.textMuted}]}>
        WATERMARK PREVIEW
      </Text>
      <View style={previewStyles.canvas}>
        {/* Simulated photo background */}
        <View style={previewStyles.photoBackground}>
          {/* Simulated landscape */}
          <View style={previewStyles.sky} />
          <View style={previewStyles.ground} />
        </View>

        {/* Watermark block positioned inside canvas */}
        <View style={[previewStyles.watermarkBlock, positionStyle]}>
          <View
            style={[
              previewStyles.watermarkBg,
              {backgroundColor: `rgba(0,0,0,${settings.backgroundOpacity})`},
            ]}>
            {lines.length === 0 ? (
              <Text style={[previewStyles.noFieldsText, {color: 'rgba(255,255,255,0.5)'}]}>
                No fields visible
              </Text>
            ) : (
              lines.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    previewStyles.watermarkText,
                    {
                      color: textColor,
                      fontSize,
                      fontWeight: line.isBold ? FontWeights.bold : FontWeights.regular,
                    },
                  ]}>
                  {line.text}
                </Text>
              ))
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

const previewStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 4,
  },
  canvas: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  sky: {
    flex: 2,
    backgroundColor: '#4a90b8',
  },
  ground: {
    flex: 1,
    backgroundColor: '#6a8f4a',
  },
  watermarkBlock: {
    position: 'absolute',
    maxWidth: '85%',
  },
  watermarkBg: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  watermarkText: {
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  noFieldsText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

// ── Main Modal ────────────────────────────────────────────────────────────────

export function CoordEditModal({
  visible,
  watermarkData,
  settings,
  onSave,
  onCancel,
}: Props) {
  const {colors} = useTheme();

  // Local editable state
  const [lat, setLat] = useState(
    watermarkData.coordinates?.latitude.toFixed(6) ?? '',
  );
  const [lng, setLng] = useState(
    watermarkData.coordinates?.longitude.toFixed(6) ?? '',
  );
  const [address, setAddress] = useState(watermarkData.address ?? '');
  const [label, setLabel] = useState(watermarkData.label);
  const [dateTime, setDateTime] = useState(watermarkData.dateTime);

  const [showDate, setShowDate] = useState(settings.showDate);
  const [showTime, setShowTime] = useState(settings.showTime);
  const [showCoords, setShowCoords] = useState(settings.showCoordinates);
  const [showAddr, setShowAddr] = useState(settings.showAddress);
  const [showLabel, setShowLabel] = useState(settings.showLabel);

  // Build live preview data from current field states
  const previewWatermarkData: WatermarkData = {
    ...watermarkData,
    coordinates:
      lat && lng
        ? {
            latitude: parseFloat(lat) || 0,
            longitude: parseFloat(lng) || 0,
            accuracy: watermarkData.coordinates?.accuracy,
          }
        : null,
    address: address || 'Null',
    label,
    dateTime,
  };

  const previewSettings: WatermarkSettings = {
    ...settings,
    showDate,
    showTime,
    showCoordinates: showCoords,
    showAddress: showAddr,
    showLabel,
  };

  const handleSave = useCallback(() => {
    onSave(previewWatermarkData, previewSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, address, label, dateTime, showDate, showTime, showCoords, showAddr, showLabel]);

  const s = styles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Watermark</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.headerSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* ── Live Preview ── */}
          <WatermarkPreview
            watermarkData={previewWatermarkData}
            settings={previewSettings}
            colors={colors}
          />

          {/* ── Coordinates ── */}
          <Text style={s.sectionTitle}>COORDINATES</Text>
          <View style={s.card}>
            <FieldRow
              label="Latitude"
              value={lat}
              onChangeText={setLat}
              placeholder="e.g. 31.520370"
              keyboardType="decimal-pad"
              colors={colors}
            />
            <FieldRow
              label="Longitude"
              value={lng}
              onChangeText={setLng}
              placeholder="e.g. 74.358749"
              keyboardType="decimal-pad"
              colors={colors}
            />
          </View>

          {/* ── Address ── */}
          <Text style={s.sectionTitle}>ADDRESS</Text>
          <View style={s.card}>
            <FieldRow
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Auto-fetched or type manually"
              colors={colors}
            />
          </View>

          {/* ── Date/Time ── */}
          <Text style={s.sectionTitle}>DATE & TIME</Text>
          <View style={s.card}>
            <FieldRow
              label="DateTime"
              value={dateTime}
              onChangeText={setDateTime}
              placeholder="ISO date string"
              colors={colors}
            />
          </View>

          {/* ── Label ── */}
          <Text style={s.sectionTitle}>CUSTOM LABEL</Text>
          <View style={s.card}>
            <FieldRow
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Site A, Plot 7"
              colors={colors}
            />
          </View>

          {/* ── Visibility toggles ── */}
          <Text style={s.sectionTitle}>SHOW / HIDE FIELDS</Text>
          <View style={s.card}>
            <ToggleRow label="Show Date" value={showDate} onChange={setShowDate} colors={colors} />
            <ToggleRow label="Show Time" value={showTime} onChange={setShowTime} colors={colors} />
            <ToggleRow
              label="Show Coordinates"
              value={showCoords}
              onChange={setShowCoords}
              colors={colors}
            />
            <ToggleRow
              label="Show Address"
              value={showAddr}
              onChange={setShowAddr}
              colors={colors}
            />
            <ToggleRow
              label="Show Label"
              value={showLabel}
              onChange={setShowLabel}
              colors={colors}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.semibold,
      color: colors.textPrimary,
    },
    headerCancel: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
    },
    headerSave: {
      fontSize: FontSizes.md,
      fontWeight: FontWeights.bold,
      color: colors.primary,
    },
    scroll: {flex: 1},
    scrollContent: {paddingBottom: 40},

    sectionTitle: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      color: colors.textMuted,
      letterSpacing: 1.1,
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 20,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginHorizontal: 16,
    },
  });
