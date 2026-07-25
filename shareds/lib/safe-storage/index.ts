// Thin wrapper around localStorage that never throws.
//
// Reading or writing localStorage can fail for reasons that have nothing to do
// with this app: Safari's "Block all cookies", site-data blocking in Chrome and
// Firefox, enterprise policy, or a sandboxed iframe without allow-same-origin.
// On the server the API does not exist at all. Persistence is a convenience
// here, so every failure degrades silently instead of breaking the page.

const isAvailable = (): boolean => typeof window !== "undefined";

export const safeStorage = {
  getItem(key: string): string | null {
    if (!isAvailable()) return null;

    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`Unable to read "${key}" from localStorage:`, e);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    if (!isAvailable()) return false;

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`Unable to write "${key}" to localStorage:`, e);
      return false;
    }
  },
};
