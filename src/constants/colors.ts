// src/constants/colors.ts

export const LightColors = {
  // Backgrounds
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F2F5',
  card: '#FFFFFF',

  // Primary — deep teal
  primary: '#0D6E6E',
  primaryLight: '#1A9A9A',
  primaryDark: '#094F4F',
  primarySurface: '#E6F4F4',

  // Accent — amber
  accent: '#F59E0B',
  accentDark: '#D97706',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // GPS indicator colors
  gpsGood: '#10B981',       // strong signal
  gpsFair: '#F59E0B',       // weak signal
  gpsNone: '#EF4444',       // no signal

  // UI
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.08)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarActive: '#0D6E6E',
  tabBarInactive: '#9CA3AF',
};

export const DarkColors = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#161616',
  surfaceElevated: '#1E1E1E',
  card: '#1E1E1E',

  // Primary — same teal, slightly brighter for dark
  primary: '#1A9A9A',
  primaryLight: '#22B8B8',
  primaryDark: '#0D6E6E',
  primarySurface: '#0D2E2E',

  // Accent
  accent: '#F59E0B',
  accentDark: '#D97706',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#34D399',
  warning: '#FCD34D',
  error: '#F87171',
  info: '#60A5FA',

  // GPS
  gpsGood: '#34D399',
  gpsFair: '#FCD34D',
  gpsNone: '#F87171',

  // UI
  border: '#2D2D2D',
  borderLight: '#242424',
  divider: '#2D2D2D',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',

  // Tab bar
  tabBar: '#161616',
  tabBarActive: '#1A9A9A',
  tabBarInactive: '#6B7280',
};

export type ColorScheme = typeof LightColors;
