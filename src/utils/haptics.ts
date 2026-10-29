import * as Haptics from 'expo-haptics';

//todas son "disparar y olvidar": si el dispositivo no vibra, no pasa nada
export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};