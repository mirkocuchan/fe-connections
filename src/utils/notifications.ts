import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

//en Expo Go de Android, el solo hecho de importar expo-notifications tira error.
const unsupported =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

//require en lugar de import para que no se cargue cuando no se puede
export const Notifications: typeof import('expo-notifications') | null = unsupported
  ? null
  : require('expo-notifications');