import { isNative } from './lib/native';

export const REPO_URL = 'https://github.com/owezresul/pitchside';
/** Where people can reach the author. */
export const CONTACT = {
  telegram: 'https://t.me/+37127294250',
  whatsapp: 'https://wa.me/37127294250',
  github: 'https://github.com/owezresul',
};

/**
 * Link for donations (GitHub Sponsors, Ko-fi, Buy Me a Coffee...). While this is empty the
 * Donate button stays hidden and only the contact links show.
 */
export const DONATE_URL = '';

/** Android builds are attached to GitHub releases (see .github/workflows/android.yml). */
export const APK_URL = `${REPO_URL}/releases/latest`;

/**
 * The public address of the web app, put into the caption when someone shares an image.
 * Set VITE_APP_URL when building (needed for the Android app, which has no web address of its own).
 * In a browser it falls back to the address the app is running on. No link while developing on localhost.
 */
export function getShareUrl(): string | null {
  const env = import.meta.env.VITE_APP_URL as string | undefined;
  if (env) return env.replace(/\/$/, '');
  if (isNative) return null;
  const { hostname, origin } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' ? null : origin;
}

/** The share link without "https://" for printing on the picture, or null when there is none. */
export function getShareLabel(): string | null {
  const url = getShareUrl();
  return url ? url.replace(/^https?:\/\//, '') : null;
}
