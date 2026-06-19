// src/utils/watermarkBuilder.ts
import {format} from 'date-fns';
import {WatermarkData, WatermarkSettings} from '../types';

export interface WatermarkLine {
  text: string;
  isBold?: boolean;
}

/**
 * Builds an ordered array of text lines to render on the watermark,
 * respecting the user's toggle settings.
 */
export function buildWatermarkLines(
  data: WatermarkData,
  settings: WatermarkSettings,
): WatermarkLine[] {
  const lines: WatermarkLine[] = [];

  // Date & Time
  if (settings.showDate || settings.showTime) {
    const dt = new Date(data.dateTime);
    const parts: string[] = [];

    if (settings.showDate) {
      const dateFmt =
        settings.dateFormat === 'DD/MM/YYYY'
          ? 'dd/MM/yyyy'
          : settings.dateFormat === 'MM/DD/YYYY'
          ? 'MM/dd/yyyy'
          : 'yyyy-MM-dd';
      parts.push(format(dt, dateFmt));
    }

    if (settings.showTime) {
      const timeFmt = settings.timeFormat === '12h' ? 'hh:mm:ss a' : 'HH:mm:ss';
      parts.push(format(dt, timeFmt));
    }

    lines.push({text: parts.join('  '), isBold: true});
  }

  // Coordinates
  if (settings.showCoordinates && data.coordinates) {
    const {latitude, longitude} = data.coordinates;
    const lat = `${Math.abs(latitude).toFixed(6)}° ${latitude >= 0 ? 'N' : 'S'}`;
    const lng = `${Math.abs(longitude).toFixed(6)}° ${longitude >= 0 ? 'E' : 'W'}`;
    lines.push({text: `${lat},  ${lng}`});
  } else if (settings.showCoordinates && !data.coordinates) {
    lines.push({text: 'Coordinates: Null'});
  }

  // Address
  if (settings.showAddress) {
    const addr = data.address ?? 'Fetching...';
    lines.push({text: `📍 ${addr}`});
  }

  // Custom label/tag
  if (settings.showLabel && data.label) {
    lines.push({text: `🏷  ${data.label}`, isBold: true});
  }

  return lines;
}

/**
 * Returns pixel padding offset (x, y) for each watermark position.
 * Used by the Skia renderer to place the text block.
 */
export function getWatermarkOrigin(
  position: WatermarkSettings['position'],
  imageWidth: number,
  imageHeight: number,
  blockWidth: number,
  blockHeight: number,
  padding: number = 40,
): {x: number; y: number} {
  switch (position) {
    case 'bottom-left':
      return {x: padding, y: imageHeight - blockHeight - padding};
    case 'bottom-right':
      return {x: imageWidth - blockWidth - padding, y: imageHeight - blockHeight - padding};
    case 'top-left':
      return {x: padding, y: padding};
    case 'top-right':
      return {x: imageWidth - blockWidth - padding, y: padding};
    default:
      return {x: padding, y: imageHeight - blockHeight - padding};
  }
}

/**
 * Maps user color setting to actual hex values (text + shadow).
 */
export function getWatermarkColors(color: WatermarkSettings['textColor']): {
  text: string;
  shadow: string;
} {
  switch (color) {
    case 'white':
      return {text: '#FFFFFF', shadow: 'rgba(0,0,0,0.8)'};
    case 'black':
      return {text: '#111111', shadow: 'rgba(255,255,255,0.6)'};
    case 'yellow':
      return {text: '#FFE500', shadow: 'rgba(0,0,0,0.8)'};
  }
}
