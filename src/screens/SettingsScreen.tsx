// src/screens/SettingsScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {useTheme} from '../context/ThemeContext';
import {useSettings} from '../context/SettingsContext';
import {useLicense} from '../hooks/useLicense';
import {TagPickerModal} from '../components/TagPickerModal';
import {APP_NAME, APP_VERSION} from '../constants/config';
import {FontSizes, FontWeights} from '../constants/fonts';
import {storage} from '../utils/storage';

export function SettingsScreen() {
  const {colors, themeMode, setThemeMode, isDark} = useTheme();
  const {settings, updateWatermarkSettings, setAddressLookup} = useSettings();
  const {deviceId, licenseState} = useLicense();
  const [showTagManager, setShowTagManager] = useState(false);
  const wm = settings.watermark;

  const s = styles(colors);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const Section = ({title}: {title: string}) => (
    <Text style={s.sectionTitle}>{title}</Text>
  );

  const OptionRow = ({
    label,
    value,
    onPress,
    right,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
        {right ?? (onPress ? <Text style={s.rowChevron}>›</Text> : null)}
      </View>
    </TouchableOpacity>
  );

  const SwitchRow = ({
    label,
    value,
    onChange,
    hint,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    hint?: string;
  }) => (
    <View style={s.row}>
      <View style={{flex: 1}}>
        <Text style={s.rowLabel}>{label}</Text>
        {hint ? <Text style={s.rowHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.border, true: colors.primaryLight}}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  const SegmentRow = ({
    label,
    options,
    selected,
    onSelect,
  }: {
    label: string;
    options: {label: string; value: string}[];
    selected: string;
    onSelect: (v: any) => void;
  }) => (
    <View style={s.segmentBlock}>
      <Text style={s.segmentLabel}>{label}</Text>
      <View style={s.segmentRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              s.segmentBtn,
              selected === opt.value && {backgroundColor: colors.primary},
            ]}
            onPress={() => onSelect(opt.value)}>
            <Text
              style={[
                s.segmentBtnText,
                selected === opt.value && {color: '#fff'},
              ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleClearGallery = () => {
    Alert.alert(
      'Clear Gallery',
      'This will remove all GeoProof photos from the index. Files on disk are not deleted.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storage.savePhotos([]);
            Alert.alert('Done', 'Gallery index cleared.');
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Settings</Text>

        {/* ── Watermark defaults ── */}
        <Section title="WATERMARK DEFAULTS" />
        <View style={s.card}>
          <SegmentRow
            label="Position"
            options={[
              {label: 'Bot L', value: 'bottom-left'},
              {label: 'Bot R', value: 'bottom-right'},
              {label: 'Top L', value: 'top-left'},
              {label: 'Top R', value: 'top-right'},
            ]}
            selected={wm.position}
            onSelect={v => updateWatermarkSettings({position: v})}
          />
          <SegmentRow
            label="Text Color"
            options={[
              {label: 'White', value: 'white'},
              {label: 'Black', value: 'black'},
              {label: 'Yellow', value: 'yellow'},
            ]}
            selected={wm.textColor}
            onSelect={v => updateWatermarkSettings({textColor: v})}
          />
          <SegmentRow
            label="Font Size"
            options={[
              {label: 'Small', value: 'small'},
              {label: 'Medium', value: 'medium'},
              {label: 'Large', value: 'large'},
            ]}
            selected={wm.fontSize}
            onSelect={v => updateWatermarkSettings({fontSize: v})}
          />
          <SwitchRow
            label="Show Date"
            value={wm.showDate}
            onChange={v => updateWatermarkSettings({showDate: v})}
          />
          <SwitchRow
            label="Show Time"
            value={wm.showTime}
            onChange={v => updateWatermarkSettings({showTime: v})}
          />
          <SwitchRow
            label="Show Coordinates"
            value={wm.showCoordinates}
            onChange={v => updateWatermarkSettings({showCoordinates: v})}
          />
          <SwitchRow
            label="Show Address"
            value={wm.showAddress}
            onChange={v => updateWatermarkSettings({showAddress: v})}
          />
          <SwitchRow
            label="Show Custom Label"
            value={wm.showLabel}
            onChange={v => updateWatermarkSettings({showLabel: v})}
          />
        </View>

        {/* ── Date/Time format ── */}
        <Section title="DATE & TIME FORMAT" />
        <View style={s.card}>
          <SegmentRow
            label="Date Format"
            options={[
              {label: 'DD/MM/YYYY', value: 'DD/MM/YYYY'},
              {label: 'MM/DD/YYYY', value: 'MM/DD/YYYY'},
              {label: 'YYYY-MM-DD', value: 'YYYY-MM-DD'},
            ]}
            selected={wm.dateFormat}
            onSelect={v => updateWatermarkSettings({dateFormat: v})}
          />
          <SegmentRow
            label="Time Format"
            options={[
              {label: '24h', value: '24h'},
              {label: '12h', value: '12h'},
            ]}
            selected={wm.timeFormat}
            onSelect={v => updateWatermarkSettings({timeFormat: v})}
          />
        </View>

        {/* ── Location ── */}
        <Section title="LOCATION" />
        <View style={s.card}>
          <SwitchRow
            label="Address Lookup"
            value={settings.addressLookupEnabled}
            onChange={setAddressLookup}
            hint="Fetches address from internet (Nominatim). Turn off to save data."
          />
        </View>

        {/* ── Saved Tags ── */}
        <Section title="SAVED TAGS" />
        <View style={s.card}>
          <OptionRow
            label={`Manage Tags  (${settings.savedTags.length})`}
            onPress={() => setShowTagManager(true)}
          />
        </View>

        {/* ── Appearance ── */}
        <Section title="APPEARANCE" />
        <View style={s.card}>
          <SegmentRow
            label="Theme"
            options={[
              {label: 'Light', value: 'light'},
              {label: 'Dark', value: 'dark'},
              {label: 'System', value: 'system'},
            ]}
            selected={themeMode}
            onSelect={setThemeMode}
          />
        </View>

        {/* ── Storage ── */}
        <Section title="STORAGE" />
        <View style={s.card}>
          <OptionRow
            label="Clear Gallery Index"
            onPress={handleClearGallery}
          />
        </View>

        {/* ── About / License ── */}
        <Section title="ABOUT" />
        <View style={s.card}>
          <OptionRow label="App" value={`${APP_NAME} v${APP_VERSION}`} />
          <OptionRow
            label="License"
            value={licenseState?.isLicensed ? '✅ Active' : '❌ Not activated'}
          />
          <OptionRow
            label="Device ID"
            value={deviceId ? deviceId.slice(0, 16) + '…' : '—'}
            onPress={() => {
              Clipboard.setString(deviceId);
              Alert.alert('Copied', 'Full Device ID copied to clipboard.');
            }}
          />
          <OptionRow label="Build" value="React Native CLI · Android" />
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Tag manager modal */}
      <TagPickerModal
        visible={showTagManager}
        onSelect={() => {}}
        onClose={() => setShowTagManager(false)}
      />
    </>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    content: {padding: 16, paddingBottom: 40},
    pageTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: FontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 20,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      color: colors.textMuted,
      letterSpacing: 1.1,
      marginBottom: 8,
      marginTop: 20,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    rowLabel: {fontSize: FontSizes.md, color: colors.textPrimary, flex: 1},
    rowHint: {fontSize: FontSizes.xs, color: colors.textMuted, marginTop: 2},
    rowRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
    rowValue: {fontSize: FontSizes.sm, color: colors.textSecondary},
    rowChevron: {fontSize: 20, color: colors.textMuted},

    segmentBlock: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    segmentLabel: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: FontWeights.medium,
    },
    segmentRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
    segmentBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtnText: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
      fontWeight: FontWeights.medium,
    },
  });
