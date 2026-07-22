import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/** Opens the device photo library and returns the picked image's local URI, or
 * null if the user cancelled or denied the permission prompt. Cropping happens
 * afterward in <ImageCropper> rather than via allowsEditing — the native crop UI
 * is a no-op on web and locked to a square on iOS, so it can't give a real
 * aspect-ratio crop on every platform this app ships to. */
export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/** Uploads a local image URI to the public "club-images" Storage bucket at a
 * fixed per-club path (so re-uploading just overwrites the old header) and
 * returns a cache-busted public URL. */
export async function uploadClubHeaderImage(clubId: string, localUri: string): Promise<string | null> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${clubId}/header.jpg`;
  const { error } = await supabase.storage.from('club-images').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from('club-images').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/** Uploads a local image URI to the public "profile-photos" Storage bucket at a
 * fixed per-profile path (so re-uploading just overwrites the old photo) and
 * returns a cache-busted public URL. */
export async function uploadProfilePhoto(profileId: string, localUri: string): Promise<string | null> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${profileId}/avatar.jpg`;
  const { error } = await supabase.storage.from('profile-photos').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
