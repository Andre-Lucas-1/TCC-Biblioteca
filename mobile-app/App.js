import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import store, { persistor } from './src/store/index';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';

// Loading component for PersistGate
const Loading = () => (
  <View style={styles.loadingBackground}>
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  </View>
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
});
