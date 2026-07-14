// src/utils/imageProcessor.ts
import {Skia, ImageFormat} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import {WatermarkData, WatermarkSettings} from '../types';
import {IMAGE_QUALITY, IMAGE_MAX_DIMENSION} from '../constants/config';
import {buildWatermarkLines, getWatermarkOrigin, getWatermarkColors} from './watermarkBuilder';
import {WatermarkFontPx} from '../constants/fonts';
import {fromByteArray} from 'react-native-quick-base64';

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
  const rawData = await Skia.Data.fromURI(sourceUri);
  const skImage = Skia.Image.MakeImageFromEncoded(rawData);
  if (!skImage) throw new Error('Failed to decode image');

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

  // Draw scaled image
  const srcRect = Skia.XYWHRect(0, 0, srcW, srcH);
  const dstRect = Skia.XYWHRect(0, 0, outW, outH);
  const paint = Skia.Paint();
  canvas.drawImageRect(skImage, srcRect, dstRect, paint);

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

  const font = Skia.Font(null, fontSize);

  lines.forEach((line, i) => {
    const x = origin.x;
    const y = origin.y + i * lineHeight + fontSize;
    canvas.drawText(line.text, x, y, textPaint, font);
  });

  // ── 7. Encode & write ─────────────────────────────────────────────────────
  const snapshot = surface.makeImageSnapshot();
  const encoded = snapshot.encodeToBytes(ImageFormat.JPEG, Math.round(IMAGE_QUALITY * 100));
  if (!encoded) throw new Error('Failed to encode image');

  const dir = `${RNFS.PicturesDirectoryPath}/GeoProof`;
  await RNFS.mkdir(dir);
  const fileName = `GeoProof_${Date.now()}.jpg`;
  const outPath = `${dir}/${fileName}`;

  const base64String = fromByteArray(encoded);
  await RNFS.writeFile(outPath, base64String, 'base64');

  const stat = await RNFS.stat(outPath);

  return {
    uri: `file://${outPath}`,
    width: outW,
    height: outH,
    fileSize: stat.size,
  };
}
