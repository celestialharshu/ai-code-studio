import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { fetchMe, loginAccount, registerAccount } from '../lib/api.js';
import { clearToken, getToken, setToken } from '../lib/token.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * A token sitting in localStorage is only a claim. It may have expired, or the
   * account behind it may be gone. So on load we ask the server whether it still
   * means anything before showing the app.
   */
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((data) => setUser(data.user))
      .catch(clearToken)
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (credentials) => {
    const { token, user } = await loginAccount(credentials);
    setToken(token);
    setUser(user);
  }, []);

  const signUp = useCallback(async (details) => {
    const { token, user } = await registerAccount(details);
    setToken(token);
    setUser(user);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
