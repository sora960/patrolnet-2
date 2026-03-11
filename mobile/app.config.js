export default {
  expo: {
    jsEngine: 'hermes',
    name: 'PatrolNet',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/new-icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.patrolnet.mobile" // ✅ required by EAS
    },
    android: {
      // This is the crucial setting that allows HTTP traffic for network requests,
      // which is often required for local development and can prevent "Network Error"
      // on file uploads.
      usesCleartextTraffic: true, 
      adaptiveIcon: {
        foregroundImage: './assets/images/new-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'app.barangay.incidentreport',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/new-icon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/new-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      apiUrl: process.env.API_URL,
      eas: {
        projectId: '7466b89d-ff49-428c-bb87-ae9ac9937255',
      },
    },
  },
};
