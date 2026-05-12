import { Platform } from 'react-native';

const sansFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System'
});

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace'
});

export const typography = {
  fontFamily: {
    sans: sansFamily,
    mono: monoFamily
  },
  size: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    display: 28,
    hero: 34
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800'
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.55
  }
};
