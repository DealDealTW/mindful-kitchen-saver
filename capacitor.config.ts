import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.vite_react_shadcn_ts', // 基於 package.json 中的項目名稱
  appName: 'My React Project', // 更友好的顯示名稱
  webDir: 'dist', // 使用 Vite 的輸出目錄
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    appendUserAgent: "MyApp User Agent", // 可選，有時有助於調試
    overrideUserAgent: "MyApp User Agent", // 可選，有時有助於調試
    useLegacyBridge: false, // 確保使用最新的橋接
    // loggingBehavior: 'debug', // 啟用更詳細的日誌記錄
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0 // 如果有 SplashScreen 插件，嘗試禁用它以防衝突
    }
  }
};

export default config; 