import React from 'react';
import {Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';

export function ErrorModal({visible, error, onClose}: {visible: boolean; error: any; onClose: () => void;}) {
  if (!error) return null;
  const message = error?.message ?? String(error);
  const stack = error?.stack ?? '';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Error</Text>
          <ScrollView style={styles.body}>
            <Text style={styles.msg}>{message}</Text>
            {stack ? <Text style={styles.stack}>{stack}</Text> : null}
          </ScrollView>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%'},
  title: {fontSize: 18, fontWeight: '700', marginBottom: 8},
  body: {marginBottom: 12},
  msg: {color: '#000', marginBottom: 8},
  stack: {color: '#444', fontFamily: 'monospace'},
  row: {flexDirection: 'row', justifyContent: 'flex-end'},
  btn: {paddingHorizontal: 12, paddingVertical: 8},
  btnText: {color: '#007AFF', fontWeight: '600'},
});

export default ErrorModal;
