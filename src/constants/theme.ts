/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
    dark: {
    text: '#eceaf2',
    background: '#14161f',
    backgroundElement: '#1d2030',
    backgroundSelected: '#252940',
    textSecondary: '#a3a8bf',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Palette = {
  background: '#14161f',
  surface: '#1d2030',
  surfaceAlt: '#252940',
  outline: '#2a2e42',
  text: '#eceaf2',
  muted: '#8b90a8',
  primary: '#e9b872',
  primarySoft: 'rgba(233,184,114,0.14)',
  onPrimary: '#2a1d08',
  bubbleMine: '#e9b872',
  bubbleOther: '#252940',
  storyRing: '#9b8cf0',
  danger: '#ef6b6b',
  success: '#5fcf9a',
  border: '#2a2e42',
  skeleton: '#252940',
} as const;
