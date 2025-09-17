export interface User {
  id: string;
  email: string;
  role: 'admin' | 'worker';
  name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'auth_user';

export const authStorage = {
  getTokens: (): AuthTokens | null => {
    const tokens = localStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  },

  setTokens: (tokens: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },

  getUser: (): User | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const getAuthHeader = (): Record<string, string> => {
  const tokens = authStorage.getTokens();
  return tokens ? { Authorization: `Bearer ${tokens.access}` } : {};
};

export const isAuthenticated = (): boolean => {
  return !!authStorage.getTokens() && !!authStorage.getUser();
};

export const logout = () => {
  authStorage.clear();
  window.location.href = '/login';
};