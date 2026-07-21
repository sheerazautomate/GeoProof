export interface PhotoStoragePaths {
  DocumentDirectoryPath?: string | null;
  CachesDirectoryPath?: string | null;
  PicturesDirectoryPath?: string | null;
}

export function resolvePhotoStorageDir(paths?: PhotoStoragePaths | null): string {
  const baseDir =
    paths?.PicturesDirectoryPath ||
    paths?.DocumentDirectoryPath ||
    paths?.CachesDirectoryPath;

  if (!baseDir) {
    throw new Error('Could not resolve a valid storage directory from RNFS constants.');
  }

  return baseDir;
}

export function buildPhotoOutputPath(
  paths: PhotoStoragePaths | null | undefined,
  fileName: string,
): string {
  const baseDir = resolvePhotoStorageDir(paths);
  return `${baseDir}/GeoProof/${fileName}`;
}
