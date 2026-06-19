// src/components/CoordEditModal.tsx
import React, {useState} from 'react';
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
import {useTheme} from '../context/ThemeContext';
import {WatermarkData, WatermarkSettings} from '../types';
import {FontSizes, FontWeights} from '../constants/fonts';

interface Props {
  visible: boolean;
  watermarkData: WatermarkData;
  settings: WatermarkSettings;
  onSave: (data: WatermarkData, settings: WatermarkSettings) => void;
  onCancel: () => void;
}

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

  const handleSave = () => {
    const updatedData: WatermarkData = {
      ...watermarkData,
      coordinates:
        lat && lng
          ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              accuracy: watermarkData.coordinates?.accuracy,
            }
          : null,
      address: address || 'Null',
      label,
      dateTime,
    };
    const updatedSettings: WatermarkSettings = {
      ...settings,
      showDate,
      showTime,
      showCoordinates: showCoords,
      showAddress: showAddr,
      showLabel,
    };
    onSave(updatedData, updatedSettings);
  };

  const s = styles(colors);

  const Row = ({
    label: rowLabel,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
  }: any) => (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{rowLabel}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );

  const Toggle = ({label: tLabel, value, onChange}: any) => (
    <View style={s.toggleRow}>
      <Text style={s.toggleLabel}>{tLabel}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.border, true: colors.primaryLight}}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Watermark</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.headerSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {/* ── Coordinates ── */}
          <Text style={s.sectionTitle}>COORDINATES</Text>
          <View style={s.card}>
            <Row
              label="Latitude"
              value={lat}
              onChangeText={setLat}
              placeholder="e.g. 31.520370"
              keyboardType="numeric"
            />
            <Row
              label="Longitude"
              value={lng}
              onChangeText={setLng}
              placeholder="e.g. 74.358749"
              keyboardType="numeric"
            />
          </View>

          {/* ── Address ── */}
          <Text style={s.sectionTitle}>ADDRESS</Text>
          <View style={s.card}>
            <Row
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Auto-fetched or type manually"
            />
          </View>

          {/* ── Date/Time ── */}
          <Text style={s.sectionTitle}>DATE & TIME</Text>
          <View style={s.card}>
            <Row
              label="DateTime"
              value={dateTime}
              onChangeText={setDateTime}
              placeholder="ISO date string"
            />
          </View>

          {/* ── Label ── */}
          <Text style={s.sectionTitle}>CUSTOM LABEL</Text>
          <View style={s.card}>
            <Row
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Site A, Plot 7"
            />
          </View>

          {/* ── Visibility toggles ── */}
          <Text style={s.sectionTitle}>SHOW / HIDE FIELDS</Text>
          <View style={s.card}>
            <Toggle label="Show Date" value={showDate} onChange={setShowDate} />
            <Toggle label="Show Time" value={showTime} onChange={setShowTime} />
            <Toggle
              label="Show Coordinates"
              value={showCoords}
              onChange={setShowCoords}
            />
            <Toggle
              label="Show Address"
              value={showAddr}
              onChange={setShowAddr}
            />
            <Toggle
              label="Show Label"
              value={showLabel}
              onChange={setShowLabel}
            />
          </View>
        </ScrollView>
      </View>
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
    scrollContent: {padding: 16, paddingBottom: 40},

    sectionTitle: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      color: colors.textMuted,
      letterSpacing: 1.1,
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
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
