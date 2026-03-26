export const MAPY_API_KEY = process.env.EXPO_PUBLIC_MAPY_API_KEY ?? '';
export const MAPY_WEBVIEW_USER_AGENT =
  process.env.EXPO_PUBLIC_MAPY_USER_AGENT ?? 'climbing-app-mapy-webview/1.0';

export function hasMapyApiKey(): boolean {
  return MAPY_API_KEY.trim().length > 0;
}
