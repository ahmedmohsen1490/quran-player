import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quranplayer.app',
  appName: 'Quran Player',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
