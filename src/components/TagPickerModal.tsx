// src/components/TagPickerModal.tsx
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useSettings} from '../context/SettingsContext';
import {SavedTag, GPSCoordinates} from '../types';
import {FontSizes, FontWeights} from '../constants/fonts';

interface Props {
  visible: boolean;
  onSelect: (tag: SavedTag) => void;
  onClose: () => void;
  currentCoords?: GPSCoordinates | null;
}

export function TagPickerModal({visible, onSelect, onClose, currentCoords}: Props) {
  const {colors} = useTheme();
  const {settings, addSavedTag, deleteSavedTag} = useSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState(
    currentCoords?.latitude.toFixed(6) ?? '',
  );
  const [newLng, setNewLng] = useState(
    currentCoords?.longitude.toFixed(6) ?? '',
  );

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this tag.');
      return;
    }
    if (!newLat || !newLng) {
      Alert.alert('Coordinates required', 'Please enter latitude and longitude.');
      return;
    }
    const tag: SavedTag = {
      id: Date.now().toString(),
      name: newName.trim(),
      coordinates: {
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
      },
      createdAt: Date.now(),
    };
    await addSavedTag(tag);
    setNewName('');
    setShowAddForm(false);
  };

  const handleDelete = (tag: SavedTag) => {
    Alert.alert('Delete Tag', `Remove "${tag.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSavedTag(tag.id),
      },
    ]);
  };

  const s = styles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Saved Tags</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.doneBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Add tag button */}
        {!showAddForm && (
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => {
              setNewLat(currentCoords?.latitude.toFixed(6) ?? '');
              setNewLng(currentCoords?.longitude.toFixed(6) ?? '');
              setShowAddForm(true);
            }}>
            <Text style={s.addBtnText}>＋  Save Current / New Tag</Text>
          </TouchableOpacity>
        )}

        {/* Add form */}
        {showAddForm && (
          <View style={s.addForm}>
            <TextInput
              style={s.formInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Tag name (e.g. Site A)"
              placeholderTextColor={colors.textMuted}
            />
            <View style={s.coordRow}>
              <TextInput
                style={[s.formInput, {flex: 1, marginRight: 8}]}
                value={newLat}
                onChangeText={setNewLat}
                placeholder="Latitude"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <TextInput
                style={[s.formInput, {flex: 1}]}
                value={newLng}
                onChangeText={setNewLng}
                placeholder="Longitude"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={s.formActions}>
              <TouchableOpacity
                style={s.cancelFormBtn}
                onPress={() => setShowAddForm(false)}>
                <Text style={s.cancelFormText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveFormBtn} onPress={handleAdd}>
                <Text style={s.saveFormText}>Save Tag</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tags list */}
        <FlatList
          data={settings.savedTags}
          keyExtractor={t => t.id}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🏷</Text>
              <Text style={s.emptyText}>No saved tags yet.</Text>
              <Text style={s.emptyHint}>
                Save your frequent locations as tags for quick access.
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={s.tagItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              onLongPress={() => handleDelete(item)}>
              <View style={s.tagLeft}>
                <Text style={s.tagName}>{item.name}</Text>
                <Text style={s.tagCoords}>
                  {item.coordinates.latitude.toFixed(5)},{' '}
                  {item.coordinates.longitude.toFixed(5)}
                </Text>
              </View>
              <Text style={s.tagArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
        <Text style={s.hint}>Long-press a tag to delete it.</Text>
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
    doneBtn: {
      fontSize: FontSizes.md,
      fontWeight: FontWeights.bold,
      color: colors.primary,
    },
    addBtn: {
      margin: 16,
      backgroundColor: colors.primarySurface,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
    },
    addBtnText: {
      color: colors.primary,
      fontWeight: FontWeights.semibold,
      fontSize: FontSizes.md,
    },
    addForm: {
      margin: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      color: colors.textPrimary,
      fontSize: FontSizes.md,
      backgroundColor: colors.surfaceElevated,
      marginBottom: 10,
    },
    coordRow: {flexDirection: 'row'},
    formActions: {flexDirection: 'row', gap: 10},
    cancelFormBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelFormText: {color: colors.textSecondary, fontWeight: FontWeights.medium},
    saveFormBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveFormText: {color: '#fff', fontWeight: FontWeights.bold},

    tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagLeft: {flex: 1},
    tagName: {
      fontSize: FontSizes.md,
      fontWeight: FontWeights.semibold,
      color: colors.textPrimary,
    },
    tagCoords: {
      fontSize: FontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'monospace',
    },
    tagArrow: {fontSize: 22, color: colors.textMuted},
    emptyBox: {alignItems: 'center', paddingTop: 60},
    emptyIcon: {fontSize: 48, marginBottom: 12},
    emptyText: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.semibold,
      color: colors.textSecondary,
    },
    emptyHint: {
      fontSize: FontSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 32,
    },
    hint: {
      textAlign: 'center',
      fontSize: FontSizes.xs,
      color: colors.textMuted,
      paddingBottom: 16,
    },
  });
