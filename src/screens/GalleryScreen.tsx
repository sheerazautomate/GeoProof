// src/screens/GalleryScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Share,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {useTheme} from '../context/ThemeContext';
import {storage} from '../utils/storage';
import {GeoProofPhoto} from '../types';
import {FontSizes, FontWeights} from '../constants/fonts';
import {format} from 'date-fns';

const {width: SW} = Dimensions.get('window');
const COLS = 3;
const CELL = (SW - 4) / COLS;

export function GalleryScreen() {
  const {colors} = useTheme();
  const [photos, setPhotos] = useState<GeoProofPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GeoProofPhoto | null>(null);

  const loadPhotos = useCallback(async () => {
    const saved = await storage.getPhotos();
    setPhotos(saved ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleDelete = async (photo: GeoProofPhoto) => {
    Alert.alert('Delete Photo', 'Remove this photo from GeoProof gallery?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await RNFS.unlink(photo.uri.replace('file://', ''));
          } catch {}
          await storage.deletePhoto(photo.id);
          setSelected(null);
          loadPhotos();
        },
      },
    ]);
  };

  const handleShare = async (photo: GeoProofPhoto) => {
    try {
      await Share.share({
        url: photo.uri,
        title: 'GeoProof Photo',
        message: `📍 ${photo.watermarkData.coordinates?.latitude.toFixed(5)}, ${photo.watermarkData.coordinates?.longitude.toFixed(5)}\n🕐 ${format(photo.capturedAt, 'dd/MM/yyyy HH:mm')}`,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const s = styles(colors);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Gallery</Text>
        <Text style={s.headerCount}>{photos.length} photos</Text>
      </View>

      {photos.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>📷</Text>
          <Text style={s.emptyTitle}>No photos yet</Text>
          <Text style={s.emptyHint}>
            Capture or upload a photo to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={p => p.id}
          numColumns={COLS}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              activeOpacity={0.85}>
              <Image
                source={{uri: item.uri}}
                style={s.cell}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{paddingBottom: 40}}
        />
      )}

      {/* Full-screen photo viewer */}
      <Modal
        visible={!!selected}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={s.viewer}>
            <Image
              source={{uri: selected.uri}}
              style={s.viewerImage}
              resizeMode="contain"
            />

            {/* Close button */}
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setSelected(null)}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Metadata panel */}
            <ScrollView style={s.metaPanel}>
              <Text style={s.metaTitle}>Photo Details</Text>

              <MetaRow
                label="Date"
                value={format(selected.capturedAt, 'dd/MM/yyyy HH:mm:ss')}
                colors={colors}
              />
              {selected.watermarkData.coordinates && (
                <>
                  <MetaRow
                    label="Latitude"
                    value={selected.watermarkData.coordinates.latitude.toFixed(6)}
                    colors={colors}
                    mono
                  />
                  <MetaRow
                    label="Longitude"
                    value={selected.watermarkData.coordinates.longitude.toFixed(6)}
                    colors={colors}
                    mono
                  />
                  {selected.watermarkData.coordinates.accuracy && (
                    <MetaRow
                      label="Accuracy"
                      value={`±${selected.watermarkData.coordinates.accuracy.toFixed(0)}m`}
                      colors={colors}
                    />
                  )}
                </>
              )}
              <MetaRow
                label="Address"
                value={selected.watermarkData.address ?? 'Null'}
                colors={colors}
              />
              {selected.watermarkData.label ? (
                <MetaRow
                  label="Label"
                  value={selected.watermarkData.label}
                  colors={colors}
                />
              ) : null}
              <MetaRow
                label="Resolution"
                value={`${selected.width} × ${selected.height}`}
                colors={colors}
              />
              <MetaRow
                label="File size"
                value={formatFileSize(selected.fileSize)}
                colors={colors}
              />

              {/* Actions */}
              <View style={s.viewerActions}>
                <TouchableOpacity
                  style={[s.viewerBtn, {backgroundColor: colors.primary}]}
                  onPress={() => handleShare(selected)}>
                  <Text style={s.viewerBtnText}>📤  Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.viewerBtn, {backgroundColor: colors.error}]}
                  onPress={() => handleDelete(selected)}>
                  <Text style={s.viewerBtnText}>🗑  Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function MetaRow({
  label,
  value,
  colors,
  mono = false,
}: {
  label: string;
  value: string;
  colors: any;
  mono?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
      <Text
        style={{
          fontSize: FontSizes.sm,
          color: colors.textMuted,
          fontWeight: FontWeights.medium,
        }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: FontSizes.sm,
          color: colors.textPrimary,
          fontFamily: mono ? 'monospace' : undefined,
          flexShrink: 1,
          textAlign: 'right',
          marginLeft: 12,
        }}>
        {value}
      </Text>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    headerTitle: {
      fontSize: FontSizes.xxl,
      fontWeight: FontWeights.bold,
      color: colors.textPrimary,
    },
    headerCount: {fontSize: FontSizes.sm, color: colors.textMuted},

    cell: {width: CELL, height: CELL, margin: 0.5},

    emptyBox: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100},
    emptyIcon: {fontSize: 64, marginBottom: 16},
    emptyTitle: {
      fontSize: FontSizes.xl,
      fontWeight: FontWeights.bold,
      color: colors.textSecondary,
    },
    emptyHint: {
      fontSize: FontSizes.md,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 32,
    },

    viewer: {flex: 1, backgroundColor: '#000'},
    viewerImage: {flex: 1},
    closeBtn: {
      position: 'absolute',
      top: 48,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeBtnText: {color: '#fff', fontSize: 18},
    metaPanel: {
      backgroundColor: colors.surface,
      maxHeight: 320,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    metaTitle: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    viewerActions: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 16,
    },
    viewerBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    viewerBtnText: {
      color: '#fff',
      fontWeight: FontWeights.bold,
      fontSize: FontSizes.md,
    },
  });
