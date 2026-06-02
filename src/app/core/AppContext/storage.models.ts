export interface PersistedAuthState {
  token: string;
  role: string | null;
  userId: string | null;
  expiresAt: number | null;
}

export type ThemePreference = 'dark' | 'light';

export interface EncryptedEntry {
  id: string;
  payload: string;
  updatedAt: number;
}