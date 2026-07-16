import {resolvePhotoStorageDir, buildPhotoOutputPath} from '../src/utils/photoFileStorage';

describe('photo file storage helpers', () => {
  it('prefers the app document directory when available', () => {
    const dir = resolvePhotoStorageDir({
      DocumentDirectoryPath: '/data/app/files',
      CachesDirectoryPath: '/data/app/cache',
      PicturesDirectoryPath: '/sdcard/Pictures',
    });

    expect(dir).toBe('/data/app/files');
  });

  it('builds a GeoProof path inside the selected directory', () => {
    const path = buildPhotoOutputPath({
      DocumentDirectoryPath: '/data/app/files',
      CachesDirectoryPath: '/data/app/cache',
      PicturesDirectoryPath: '/sdcard/Pictures',
    }, 'photo.jpg');

    expect(path).toBe('/data/app/files/GeoProof/photo.jpg');
  });
});
