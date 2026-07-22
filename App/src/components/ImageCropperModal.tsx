import React from 'react';
import { Modal } from 'react-native';

export type ImageCropperModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

/** Native just gets a real system modal. See ImageCropperModal.web.tsx for why web needs
 * a different mechanism. */
export function ImageCropperModal({ visible, onRequestClose, children }: ImageCropperModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}
