import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { KeepAwake } from '@capacitor-community/keep-awake';

/** True inside the Android app, false in the browser/PWA. */
export const isNative = Capacitor.isNativePlatform();

function toBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] ?? '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

/** Opens the Android share sheet with the image attached. */
export async function shareImageNative(blob: Blob, title: string, text?: string) {
  const path = `share-${Date.now()}.png`;
  await Filesystem.writeFile({ path, data: await toBase64(blob), directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({ title, text, files: [uri] });
}

/** Buzz when the match clock hits zero. */
export function buzz() {
  if (isNative) void Haptics.vibrate({ duration: 400 }).catch(() => undefined);
  else navigator.vibrate?.([220, 120, 220]);
}

/** Keep the screen on while a match is running (Android app only, browsers manage this themselves). */
export function setKeepAwake(on: boolean) {
  if (!isNative) return;
  void (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()).catch(() => undefined);
}
