import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';

/** Tab screens live nested inside AppStack's "Tabs" screen; unhandled route names
 * (PersonProfile, EventDetail, etc.) bubble up to this parent stack automatically. */
export function useAppNavigation() {
  return useNavigation<NativeStackNavigationProp<AppStackParamList>>();
}
