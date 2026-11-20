import React, { useEffect } from 'react';
import { View, StyleSheet, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { WebView } from 'react-native-webview';
import html from './gamepadHtml';

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {}
    })();
  }, []);

  // Messages from the gamepad page:
  //   { t: 'buzz', ms }   -> haptic feedback
  //   { t: 'state', s }   -> gamepad state (buttons, axes, triggers)
  // The Xbox connection layer will consume 'state' here.
  const onMessage = (e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.t === 'buzz') Vibration.vibrate(m.ms || 12);
    } catch (err) {}
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={onMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  web: { flex: 1, backgroundColor: '#050505' },
});
