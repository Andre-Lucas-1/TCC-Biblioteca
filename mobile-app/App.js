import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, ActivityIndicator, StyleSheet, Image, ImageBackground } from 'react-native';

import store, { persistor } from './src/store/index';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';

// Loading component for PersistGate
const SPLASH_BG = require('./assets/Gemini_Generated_Image_tyzn4ftyzn4ftyzn.png');
const SPLASH_ICON = require('./assets/Gemini_Generated_Image_3zzytb3zzytb3zzy-removebg-preview.png');


const Loading = () => (
  <ImageBackground source={SPLASH_BG} style={styles.loadingBackground} resizeMode="cover">
    <View style={styles.loadingCenter}>
      <Image source={SPLASH_ICON} style={styles.logo} resizeMode="contain" />
    </View>
  </ImageBackground>
);

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <View style={styles.appContainer}>
          <StatusBar style="auto" />
          <AppNavigator />
        </View>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingBackground: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
