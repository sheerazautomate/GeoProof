import RNFetchBlob from 'react-native-blob-util';
import * as RNFS from '@dr.pogodin/react-native-fs';

export async function ensureLocalFileUri(uri: string): Promise<string> {
  if (!uri) throw new Error('Empty URI');
  if (uri.startsWith('file://')) return uri;

  const dir = `${RNFS.CachesDirectoryPath}/GeoProof`;
  try {
    await RNFS.mkdir(dir);
  } catch {}

  const tmpPath = `${dir}/uri_${Date.now()}.jpg`;

  try {
    // RNFetchBlob can read content:// and other provider URIs on Android.
    const base64 = await RNFetchBlob.fs.readFile(uri, 'base64');
    await RNFS.writeFile(tmpPath, base64, 'base64');
    return `file://${tmpPath}`;
  } catch (err: any) {
    throw new Error(`Failed to resolve URI to local file: ${err?.message ?? err}`);
  }
}

export async function tryUnlinkLocalFile(fileUri: string) {
  if (!fileUri) return;
  if (!fileUri.startsWith('file://')) return;
  try {
    const path = fileUri.replace('file://', '');
    // Importing unlink here would create a circular import in some cases,
    // but using RNFetchBlob.fs.unlink is convenient.
    await RNFetchBlob.fs.unlink(path);
  } catch {}
}

export default {ensureLocalFileUri, tryUnlinkLocalFile};
