import { Alert, Platform } from 'react-native';

/** react-native-web's Alert.alert is a total no-op, so a plain Alert.alert call
 * silently does nothing on web (no dialog, no callback). These wrappers fall back
 * to window.confirm/alert on web so destructive actions and messages actually fire. */
export function confirmAndRun(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
