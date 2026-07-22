import {SaveLocation} from '../types';

export interface PhotoStoragePaths {
  DocumentDirectoryPath?: string | null;
  CachesDirectoryPath?: string | null;
  PicturesDirectoryPath?: string | null;
}

export function resolvePhotoStorageDir(
  paths?: PhotoStoragePaths | null,
  location: SaveLocation = 'app-private',
): string {
  if (!paths) {
    throw new Error('Could not resolve a valid storage directory from RNFS constants.');
  }

  switch (location) {
    case 'external-pictures':
      return (
        paths.PicturesDirectoryPath ||
        paths.DocumentDirectoryPath ||
        paths.CachesDirectoryPath ||
        (() => {
          throw new Error('Could not resolve Pictures directory for external save location.');
        })()
      );
    case 'cache':
      return (
        paths.CachesDirectoryPath ||
        paths.DocumentDirectoryPath ||
        paths.PicturesDirectoryPath ||
        (() => {
          throw new Error('Could not resolve Cache directory for save location.');
        })()
      );
    case 'app-private':
    default:
      return (
        paths.DocumentDirectoryPath ||
        paths.CachesDirectoryPath ||
        paths.PicturesDirectoryPath ||
        (() => {
          throw new Error('Could not resolve Document directory for app-private save location.');
        })()
      );
  }
}

export function buildPhotoOutputPath(
  paths: PhotoStoragePaths | null | undefined,
  fileName: string,
  location: SaveLocation = 'app-private',
): string {
  const baseDir = resolvePhotoStorageDir(paths, location);
  return `${baseDir}/GeoProof/${fileName}`;
}
