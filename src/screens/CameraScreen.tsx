// src/screens/CameraScreen.tsx
import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Camera,
  CameraRef,
  useCameraDevices,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import {useTheme} from '../context/ThemeContext';
import {useSettings} from '../context/SettingsContext';
import {useGPS} from '../hooks/useGPS';
import {useReverseGeo} from '../hooks/useReverseGeo';
import {CoordEditModal} from '../components/CoordEditModal';
import {TagPickerModal} from '../components/TagPickerModal';
import {processImageWithWatermark} from '../utils/imageProcessor';
import {storage} from '../utils/storage';
import {tryUnlinkLocalFile} from '../utils/uriResolver';
import ErrorModal from '../components/ErrorModal';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {WatermarkData, GeoProofPhoto, SavedTag} from '../types';
import {FontSizes, FontWeights} from '../constants/fonts';

const {width: SW} = Dimensions.get('window');

export function CameraScreen() {
  const {colors} = useTheme();
  const {settings} = useSettings();
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isFront, setIsFront] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === (isFront ? 'front' : 'back'));
  const cameraRef = useRef<CameraRef>(null);
  const photoOutput = usePhotoOutput();

  const {coordinates, status: gpsStatus} = useGPS();
  const {address, isOnline} = useReverseGeo(
    coordinates,
    settings.addressLookupEnabled,
  );

  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);
  const [editableWatermark, setEditableWatermark] = useState<WatermarkData | null>(null);
  const [customLabel, setCustomLabel] = useState('');

  const buildWatermarkData = useCallback((): WatermarkData => ({
    coordinates,
    address: address ?? (isOnline ? null : 'Null'),
    dateTime: new Date().toISOString(),
    label: customLabel,
    isOnline,
  }), [coordinates, address, isOnline, customLabel]);

  const handleCapture = useCallback(async () => {
    if (!photoOutput || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await photoOutput.capturePhoto({
        flashMode: flash,
        enableShutterSound: true,
      }, {});
      const uri = `file://${photo.path}`;

      const wmData = buildWatermarkData();
      setPendingPhoto(uri);
      setEditableWatermark(wmData);
      setShowEditModal(true);
    } catch (e: any) {
      setError(e);
      Alert.alert('Capture failed', e.message);
    } finally {
      setIsCapturing(false);
    }
  }, [photoOutput, isCapturing, flash, buildWatermarkData]);

  const handleSavePhoto = useCallback(
    async (wmData: WatermarkData, wmSettings: typeof settings.watermark) => {
      setShowEditModal(false);
      if (!pendingPhoto) return;

      setIsCapturing(true);
      try {
        const result = await processImageWithWatermark(
          pendingPhoto,
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
        Alert.alert('✅ Saved', 'Photo saved to GeoProof gallery.');
        try {
          await tryUnlinkLocalFile(pendingPhoto);
        } catch (cleanupError: any) {
          console.warn('Failed to remove temporary photo:', cleanupError);
        }
      } catch (e: any) {
        setError(e);
        Alert.alert('Save failed', e.message);
      } finally {
        setIsCapturing(false);
        setPendingPhoto(null);
        setEditableWatermark(null);
      }
    },
    [pendingPhoto, settings.watermark],
  );

  const handleTagSelect = (tag: SavedTag) => {
    setCustomLabel(tag.name);
    if (editableWatermark) {
      setEditableWatermark({
        ...editableWatermark,
        coordinates: tag.coordinates,
        label: tag.name,
      });
    }
  };

  // ── Permission states ──────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.textPrimary, marginBottom: 16}}>
          Camera permission required
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, {backgroundColor: colors.primary}]}
          onPress={requestPermission}>
          <Text style={{color: '#fff', fontWeight: FontWeights.bold}}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{color: colors.textSecondary, marginTop: 12}}>
          Loading camera…
        </Text>
      </View>
    );
  }

  const gpsColor =
    gpsStatus === 'good'
      ? colors.gpsGood
      : gpsStatus === 'fair'
      ? colors.gpsFair
      : colors.gpsNone;

  const gpsLabel =
    gpsStatus === 'acquiring'
      ? '⟳ Acquiring GPS…'
      : gpsStatus === 'denied'
      ? '✕ GPS denied'
      : gpsStatus === 'none'
      ? '✕ No GPS'
      : coordinates
      ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
      : '…';

  return (
    <View style={styles.root}>
      {/* Camera viewfinder */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!showEditModal && !showTagModal}
        outputs={[photoOutput]}
        enableNativeZoomGesture
        torchMode={flash === 'on' ? 'on' : 'off'}
      />

      {/* GPS status overlay */}
      <View style={styles.gpsBar}>
        <View style={[styles.gpsDot, {backgroundColor: gpsColor}]} />
        <Text style={styles.gpsText}>{gpsLabel}</Text>
        {address && address !== 'Null' && (
          <Text style={styles.addressText} numberOfLines={1}>
            📍 {address}
          </Text>
        )}
      </View>

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFlash(f => (f === 'off' ? 'on' : 'off'))}>
          <Text style={styles.iconBtnText}>{flash === 'on' ? '⚡' : '🔦'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowTagModal(true)}>
          <Text style={styles.iconBtnText}>🏷</Text>
        </TouchableOpacity>
        {customLabel ? (
          <View style={styles.labelBadge}>
            <Text style={styles.labelBadgeText}>{customLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom capture bar */}
      <View style={styles.bottomBar}>
        <View style={{width: 48}} />
        <TouchableOpacity
          style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}>
          {isCapturing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsFront(f => !f)}>
          <Text style={styles.iconBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Edit watermark modal */}
      {showEditModal && editableWatermark && (
        <CoordEditModal
          visible={showEditModal}
          watermarkData={editableWatermark}
          settings={settings.watermark}
          onSave={handleSavePhoto}
          onCancel={() => {
            setShowEditModal(false);
            setPendingPhoto(null);
            setEditableWatermark(null);
          }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  gpsBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'column',
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  gpsText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
  addressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.xs,
    marginTop: 2,
  },

  topControls: {
    position: 'absolute',
    top: 130,
    right: 16,
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {fontSize: 20},
  labelBadge: {
    backgroundColor: 'rgba(13,110,110,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 120,
  },
  labelBadgeText: {color: '#fff', fontSize: FontSizes.xs},

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {opacity: 0.5},
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  permBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
});
