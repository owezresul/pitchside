import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // The app id is permanent once the app is on Google Play, so change it before the first upload if you want another one.
  appId: 'com.owezresul.pitchside',
  appName: 'Pitchside',
  webDir: 'dist',
  backgroundColor: '#0F2019',
  android: { allowMixedContent: false },
};

export default config;
