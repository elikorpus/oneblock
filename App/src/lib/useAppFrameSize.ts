import { Dimensions } from 'react-native';

/** The usable app viewport size. On native this is just the device window/screen —
 * there's no surrounding frame. See useAppFrameSize.web.ts for the web override. */
export function useAppFrameSize() {
  return Dimensions.get('window');
}
