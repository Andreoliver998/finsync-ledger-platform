import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'finsync.auth.token.v1';

/**
 * Secure persistence for auth credentials only.
 * Uses Android Keystore / iOS Keychain. Never store large state here.
 */
export const authStorage = {
  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token) {
    if (!token) {
      return this.clearToken();
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
    });
  },

  async clearToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* noop */
    }
  }
};
