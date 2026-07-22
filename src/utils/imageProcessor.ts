// src/utils/imageProcessor.ts
import {Skia, ImageFormat} from '@shopify/react-native-skia';
import {fromByteArray} from 'react-native-quick-base64';
import {WatermarkData, WatermarkSettings} from '../types';
import {IMAGE_QUALITY, IMAGE_MAX_DIMENSION} from '../constants/config';
import {buildWatermarkLines, getWatermarkOrigin, getWatermarkColors} from './watermarkBuilder';
import {WatermarkFontPx} from '../constants/fonts';
import {buildPhotoOutputPath} from './photoFileStorage';
import * as RNFS from '@dr.pogodin/react-native-fs';

export interface ProcessResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Core pipeline:
 * 1. Load image into Skia surface
 * 2. Scale down if larger than IMAGE_MAX_DIMENSION
 * 3. Render text watermark onto the surface
 * 4. Encode as JPEG at IMAGE_QUALITY
 * 5. Write to app's Pictures directory
 * 6. Return local URI
 */
export async function processImageWithWatermark(
  sourceUri: string,
  watermarkData: WatermarkData,
  settings: WatermarkSettings,
): Promise<ProcessResult> {
  // ── 1. Load source image ──────────────────────────────────────────────────
  // Guard: Skia.Data.fromURI may return null for unsupported URI schemes
  // (e.g. some Android content:// URIs). Provide an explicit, actionable
  // error message rather than passing null to native calls which produce
  // opaque native exceptions like "Value is null, expected an object".
  const rawData = await Skia.Data.fromURI(sourceUri);
  if (!rawData) {
    throw new Error(`Skia.Data.fromURI returned null for sourceUri=${sourceUri}`);
  }

  let skImage;
  try {
    skImage = Skia.Image.MakeImageFromEncoded(rawData);
  } catch (err: any) {
    throw new Error(
      `Skia.Image.MakeImageFromEncoded failed for sourceUri=${sourceUri}: ${err?.message ?? err}`,
    );
  }
  if (!skImage) throw new Error('Failed to decode image (MakeImageFromEncoded returned null)');

  const srcW = skImage.width();
  const srcH = skImage.height();

  // ── 2. Compute scaled dimensions ──────────────────────────────────────────
  let outW = srcW;
  let outH = srcH;
  if (srcW > IMAGE_MAX_DIMENSION || srcH > IMAGE_MAX_DIMENSION) {
    const ratio = Math.min(IMAGE_MAX_DIMENSION / srcW, IMAGE_MAX_DIMENSION / srcH);
    outW = Math.round(srcW * ratio);
    outH = Math.round(srcH * ratio);
  }

  // ── 3. Create Skia surface & draw image ──────────────────────────────────
  const surface = Skia.Surface.Make(outW, outH);
  if (!surface) throw new Error('Failed to create Skia surface');
  const canvas = surface.getCanvas();

  // Draw scaled image (guard draw errors)
  try {
    const srcRect = Skia.XYWHRect(0, 0, srcW, srcH);
    const dstRect = Skia.XYWHRect(0, 0, outW, outH);
    const paint = Skia.Paint();
    canvas.drawImageRect(skImage, srcRect, dstRect, paint);
  } catch (err: any) {
    throw new Error(`Skia canvas.drawImageRect failed: ${err?.message ?? err}`);
  }

  // ── 4. Build watermark text lines ────────────────────────────────────────
  const lines = buildWatermarkLines(watermarkData, settings);
  const {text: textColor} = getWatermarkColors(settings.textColor);
  const fontSize = WatermarkFontPx[settings.fontSize];
  const lineHeight = fontSize * 1.45;
  const hPad = 20;
  const vPad = 14;

  // Measure approx block width (Skia doesn't have measureText easily, estimate)
  const longestLine = lines.reduce(
    (a, b) => (b.text.length > a.text.length ? b : a),
    {text: ''},
  );
  const approxCharWidth = fontSize * 0.58;
  const blockW = longestLine.text.length * approxCharWidth + hPad * 2;
  const blockH = lines.length * lineHeight + vPad * 2;

  const origin = getWatermarkOrigin(
    settings.position,
    outW,
    outH,
    blockW,
    blockH,
  );

  // ── 5. Draw semi-transparent background rect ──────────────────────────────
  const bgPaint = Skia.Paint();
  bgPaint.setColor(
    Skia.Color(`rgba(0,0,0,${settings.backgroundOpacity})`),
  );
  const bgRect = Skia.XYWHRect(
    origin.x - hPad,
    origin.y - vPad,
    blockW,
    blockH,
  );
  const rrect = Skia.RRectXY(bgRect, 10, 10);
  canvas.drawRRect(rrect, bgPaint);

  // ── 6. Draw text lines ────────────────────────────────────────────────────
  const textPaint = Skia.Paint();
  textPaint.setColor(Skia.Color(textColor));
  textPaint.setAntiAlias(true);

  const font = Skia.Font(undefined, fontSize);

  lines.forEach((line, i) => {
    const x = origin.x;
    const y = origin.y + i * lineHeight + fontSize;
    canvas.drawText(line.text, x, y, textPaint, font);
  });

  // ── 7. Encode & write ─────────────────────────────────────────────────────
  const snapshot = surface.makeImageSnapshot();
  if (!snapshot) throw new Error('Skia surface.makeImageSnapshot() returned null');

  const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, Math.round(IMAGE_QUALITY * 100));
  if (!bytes) throw new Error('Failed to encode image (encodeToBytes returned null)');
  const encoded = fromByteArray(bytes);

  const fileName = `GeoProof_${Date.now()}.jpg`;
  const outPath = buildPhotoOutputPath(
    {
      DocumentDirectoryPath: RNFS.DocumentDirectoryPath,
      CachesDirectoryPath: RNFS.CachesDirectoryPath,
      PicturesDirectoryPath: RNFS.PicturesDirectoryPath,
    },
    fileName,
  );

  const dir = outPath.substring(0, outPath.lastIndexOf('/'));
  try {
    await RNFS.mkdir(dir);
  } catch (err: any) {
    // mkdir may throw if exists or permission issues
    // surface the error with context
    throw new Error(`mkdir failed for dir=${dir}: ${err?.message ?? err}`);
  }

  try {
    await RNFS.writeFile(outPath, encoded, 'base64');
  } catch (err: any) {
    throw new Error(`writeFile failed for outPath=${outPath}: ${err?.message ?? err}`);
  }

  // Calculate fileSize from the base64 string (3 base64 chars = 2 bytes)
  // This avoids a race condition with RNFS.stat() on the new fork
  const fileSize = Math.floor((encoded.length * 3) / 4);

  return {
    uri: `file://${outPath}`,
    width: outW,
    height: outH,
    fileSize,
  };
}
