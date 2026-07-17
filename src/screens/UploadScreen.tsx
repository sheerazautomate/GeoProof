// src/screens/UploadScreen.tsx
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {CachesDirectoryPath} from '@dr.pogodin/react-native-fs';
import {ensureLocalFileUri, tryUnlinkLocalFile} from '../utils/uriResolver';
import {useTheme} from '../context/ThemeContext';
import {useSettings} from '../context/SettingsContext';
import {useGPS} from '../hooks/useGPS';
import {useReverseGeo} from '../hooks/useReverseGeo';
import {CoordEditModal} from '../components/CoordEditModal';
import {TagPickerModal} from '../components/TagPickerModal';
import {processImageWithWatermark} from '../utils/imageProcessor';
import {storage} from '../utils/storage';
import {WatermarkData, GeoProofPhoto, SavedTag} from '../types';
import ErrorModal from '../components/ErrorModal';
import {FontSizes, FontWeights} from '../constants/fonts';

export function UploadScreen() {
  const {colors} = useTheme();
  const {settings} = useSettings();
  const {coordinates} = useGPS();
  const {address, isOnline} = useReverseGeo(
    coordinates,
    settings.addressLookupEnabled,
  );

  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<WatermarkData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<any>(null);

  const buildWatermarkData = useCallback((): WatermarkData => ({
    coordinates,
    address: address ?? (isOnline ? null : 'Null'),
    dateTime: new Date().toISOString(),
    label: '',
    isOnline,
  }), [coordinates, address, isOnline]);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];

    try {
      const local = await ensureLocalFileUri(asset.uri);
      setSelectedUri(local);
    } catch (err: any) {
      // Fallback: use original URI if resolution fails; processor now throws clearer errors.
      setSelectedUri(asset.uri);
    }

    setWatermarkData(buildWatermarkData());
  };

  const handleTagSelect = (tag: SavedTag) => {
    if (!watermarkData) return;
    setWatermarkData({
      ...watermarkData,
      coordinates: tag.coordinates,
      label: tag.name,
    });
  };

  const handleSave = useCallback(
    async (wmData: WatermarkData, wmSettings: typeof settings.watermark) => {
      setShowEditModal(false);
      if (!selectedUri) return;
      setIsProcessing(true);
      try {
        const result = await processImageWithWatermark(
          selectedUri,
          wmData,
          wmSettings,
        );
        const photo: GeoProofPhoto = {
          id: Date.now().toString(),
          uri: result.uri,
          watermarkData: wmData,
          capturedAt: Date.now(),
          width: result.width,
          height: result.height,
          fileSize: result.fileSize,
        };
        await storage.addPhoto(photo);
        Alert.alert('✅ Saved', 'Stamped photo saved to GeoProof gallery.', [
          {
            text: 'Pick Another',
            onPress: () => {
              setSelectedUri(null);
              setWatermarkData(null);
            },
          },
          {text: 'OK'},
        ]);
        try {
          await tryUnlinkLocalFile(selectedUri);
        } catch {}
      } catch (e: any) {
        setError(e);
        Alert.alert('Error', e.message);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedUri, settings.watermark],
  );

  const s = styles(colors);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>Upload & Stamp</Text>
      <Text style={s.subtitle}>
        Pick any photo from your device and add a GPS watermark.
      </Text>

      {!selectedUri ? (
        // ── Pick image CTA ──
        <TouchableOpacity style={s.pickBox} onPress={pickImage}>
          <Text style={s.pickIcon}>🖼</Text>
          <Text style={s.pickTitle}>Choose Photo</Text>
          <Text style={s.pickHint}>Tap to open your device gallery</Text>
        </TouchableOpacity>
      ) : (
        // ── Preview + actions ──
        <View>
          <Image
            source={{uri: selectedUri}}
            style={s.preview}
            resizeMode="cover"
          />

          {/* GPS status pill */}
          <View style={s.gpsRow}>
            <View
              style={[
                s.gpsPill,
                {
                  backgroundColor: watermarkData?.coordinates
                    ? colors.primarySurface
                    : colors.surfaceElevated,
                },
              ]}>
              <Text style={s.gpsPillText}>
                {watermarkData?.coordinates
                  ? `📍 ${watermarkData.coordinates.latitude.toFixed(5)}, ${watermarkData.coordinates.longitude.toFixed(5)}`
                  : '⚠️  No GPS — coords will be Null'}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, {backgroundColor: colors.primarySurface}]}
              onPress={() => setShowTagModal(true)}>
              <Text style={[s.actionBtnText, {color: colors.primary}]}>
                🏷  Use Saved Tag
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, {backgroundColor: colors.primarySurface}]}
              onPress={() => setShowEditModal(true)}>
              <Text style={[s.actionBtnText, {color: colors.primary}]}>
                ✏️  Edit Watermark
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main stamp & save */}
          <TouchableOpacity
            style={[s.stampBtn, isProcessing && {opacity: 0.6}]}
            onPress={() => watermarkData && handleSave(watermarkData, settings.watermark)}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.stampBtnText}>💾  Stamp & Save</Text>
            )}
          </TouchableOpacity>

          {/* Change photo */}
          <TouchableOpacity
            style={s.changeBtn}
            onPress={() => {
              setSelectedUri(null);
              setWatermarkData(null);
            }}>
            <Text style={s.changeBtnText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit modal */}
      {showEditModal && watermarkData && (
        <CoordEditModal
          visible={showEditModal}
          watermarkData={watermarkData}
          settings={settings.watermark}
          onSave={(d, s) => {
            setWatermarkData(d);
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Tag picker */}
      <TagPickerModal
        visible={showTagModal}
        onSelect={handleTagSelect}
        onClose={() => setShowTagModal(false)}
        currentCoords={coordinates}
      />
      <ErrorModal visible={!!error} error={error} onClose={() => setError(null)} />
    </ScrollView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    content: {padding: 20, paddingBottom: 40},
    title: {
      fontSize: FontSizes.xxl,
      fontWeight: FontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },

    pickBox: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 16,
      alignItems: 'center',
      padding: 48,
      backgroundColor: colors.primarySurface,
    },
    pickIcon: {fontSize: 56, marginBottom: 12},
    pickTitle: {
      fontSize: FontSizes.xl,
      fontWeight: FontWeights.bold,
      color: colors.primary,
    },
    pickHint: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
      marginTop: 6,
    },

    preview: {
      width: '100%',
      height: 260,
      borderRadius: 14,
      backgroundColor: colors.surfaceElevated,
    },
    gpsRow: {marginTop: 12, marginBottom: 4},
    gpsPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    gpsPillText: {
      fontSize: FontSizes.sm,
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },

    actions: {flexDirection: 'row', gap: 10, marginTop: 12},
    actionBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    actionBtnText: {fontWeight: FontWeights.semibold, fontSize: FontSizes.sm},

    stampBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    stampBtnText: {
      color: '#fff',
      fontWeight: FontWeights.bold,
      fontSize: FontSizes.lg,
    },
    changeBtn: {marginTop: 12, alignItems: 'center', padding: 10},
    changeBtnText: {color: colors.textSecondary, fontSize: FontSizes.md},
  });
