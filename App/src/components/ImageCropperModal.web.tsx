import React from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View } from 'react-native';

export type ImageCropperModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

/** react-native-web's <Modal> portals into a node it appends directly to document.body,
 * which escapes the #phone-frame div the web build is boxed into (see public/index.html) —
 * the crop UI would render full-browser-width/height over the black letterboxing instead of
 * staying inside the phone frame. Portaling into #phone-frame itself instead keeps it
 * contained and clipped to the frame's rounded corners, same as the rest of the app. */
export function ImageCropperModal({ visible, children }: ImageCropperModalProps) {
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  const target = document.getElementById('phone-frame') ?? document.body;
  return createPortal(<View style={[StyleSheet.absoluteFill, styles.overlay]}>{children}</View>, target);
}

const styles = StyleSheet.create({
  overlay: { zIndex: 9999 },
});
