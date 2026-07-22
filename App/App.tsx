import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppStateProvider } from './src/state/AppStateContext';
import { theme } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Load all 7 custom fonts locally from your assets folder
  const [fontsLoaded] = useFonts({
    'Pliant_Medium': require('./assets/fonts/Pliant-Medium.ttf'),
    'Pliant_SemiBold': require('./assets/fonts/Pliant-SemiBold.ttf'),
    'Pliant_Bold': require('./assets/fonts/Pliant-Bold.ttf'),
    'InstrumentSans_400Regular': require('./assets/fonts/InstrumentSans_400Regular.ttf'),
    'InstrumentSans_500Medium': require('./assets/fonts/InstrumentSans_500Medium.ttf'),
    'InstrumentSans_600SemiBold': require('./assets/fonts/InstrumentSans_600SemiBold.ttf'),
    'InstrumentSans_700Bold': require('./assets/fonts/InstrumentSans_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const onLayout = useCallback(() => {}, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.paper }} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}