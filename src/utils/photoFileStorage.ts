export interface PhotoStoragePaths {
  DocumentDirectoryPath?: string | null;
  CachesDirectoryPath?: string | null;
  PicturesDirectoryPath?: string | null;
}

export function resolvePhotoStorageDir(paths?: PhotoStoragePaths | null): string {
  const baseDir =
    paths?.DocumentDirectoryPath ||
    paths?.PicturesDirectoryPath ||
    paths?.CachesDirectoryPath ||
    '/tmp';

  return baseDir;
}

export function buildPhotoOutputPath(
  paths: PhotoStoragePaths | null | undefined,
  fileName: string,
): string {
  const baseDir = resolvePhotoStorageDir(paths);
  return `${baseDir}/GeoProof/${fileName}`;
}
