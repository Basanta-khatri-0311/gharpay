import { createContext, useContext, useEffect, useState } from 'react';
import { auth, setAccessToken } from '../lib/api';

const AuthContext = createContext(null);

const LS_USER = 'gharpay_user';
const LS_TOKEN = 'gharpay_access_token';
const LS_HAS_SESSION = 'gharpay_has_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1️⃣ Try to restore from localStorage first (instant — no network)
      const storedToken = localStorage.getItem(LS_TOKEN);
      const storedUser = localStorage.getItem(LS_USER);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAccessToken(storedToken);
          if (isMounted) {
            setUser(parsedUser);
            setIsLoading(false);
          }
          // Silently try to refresh in background to rotate token
          // (don't await — don't block UI)
          auth.refresh().then((data) => {
            if (!isMounted || !data) return;
            setUser(data.user ?? data);
            if (data.accessToken) {
              setAccessToken(data.accessToken);
              localStorage.setItem(LS_TOKEN, data.accessToken);
              localStorage.setItem(LS_USER, JSON.stringify(data.user ?? data));
            }
          }).catch(() => {
            // Background refresh failed — user can still work until access token expires
          });
          return;
        } catch {
          // Corrupt data — fall through to fresh refresh
          localStorage.removeItem(LS_USER);
          localStorage.removeItem(LS_TOKEN);
        }
      }

      // 2️⃣ No local data — only attempt cookie-based refresh if we know there was a session
      const hasSession = localStorage.getItem(LS_HAS_SESSION);
      if (!hasSession) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await auth.refresh();
        if (isMounted && data) {
          setUser(data.user ?? data);
          if (data.accessToken) {
            setAccessToken(data.accessToken);
            localStorage.setItem(LS_TOKEN, data.accessToken);
            localStorage.setItem(LS_USER, JSON.stringify(data.user ?? data));
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem(LS_HAS_SESSION);
          localStorage.removeItem(LS_TOKEN);
          localStorage.removeItem(LS_USER);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (credentials) => {
    const data = await auth.login(credentials);
    setUser(data.user);
    setAccessToken(data.accessToken);
    // Persist for reloads
    localStorage.setItem(LS_HAS_SESSION, '1');
    localStorage.setItem(LS_TOKEN, data.accessToken);
    localStorage.setItem(LS_USER, JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(LS_HAS_SESSION);
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}