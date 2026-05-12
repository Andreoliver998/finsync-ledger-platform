import { authStorage } from './authStorage';

/**
 * Backward-compatible alias. Auth credentials remain in SecureStore.
 */
export const tokenStorage = {
  get: () => authStorage.getToken(),
  set: (token) => authStorage.setToken(token),
  clear: () => authStorage.clearToken()
};
