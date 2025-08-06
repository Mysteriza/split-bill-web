import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mysteriza.kalkulatorreceh',
  appName: 'Kalkulator Receh',
  webDir: 'out', // <-- Pastikan nilainya adalah 'out'
  server: {
    androidScheme: 'https'
  }
};

export default config;