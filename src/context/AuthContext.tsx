import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { User } from '../types';
import { DEMO_USERS } from '../data/mockData';

export const STORAGE_USER = 'trace_user_id_v2';
export const STORAGE_AUTH = 'trace_auth_state_v2';
export const STORAGE_TOKEN = 'trace_token';
export const LEGACY_STORAGE_USER = 'trace_user_id';
export const LEGACY_STORAGE_AUTH = 'trace_auth_state';

const API_BASE = 'http://127.0.0.1:8000/api';

export interface StoredAuthInfo {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
  user: User | null;
}

export const getStoredAuthInfo = (): StoredAuthInfo => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, userId: null, token: null, user: null };
  }
  try {
    const authState =
      localStorage.getItem(STORAGE_AUTH) ||
      sessionStorage.getItem(STORAGE_AUTH) ||
      localStorage.getItem(LEGACY_STORAGE_AUTH) ||
      sessionStorage.getItem(LEGACY_STORAGE_AUTH);

    const token =
      localStorage.getItem(STORAGE_TOKEN) ||
      sessionStorage.getItem(STORAGE_TOKEN) ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    const userId =
      localStorage.getItem(STORAGE_USER) ||
      sessionStorage.getItem(STORAGE_USER) ||
      localStorage.getItem(LEGACY_STORAGE_USER) ||
      sessionStorage.getItem(LEGACY_STORAGE_USER);

    if (authState === 'unauthenticated') {
      return { isAuthenticated: false, userId: null, token: null, user: null };
    }

    if (authState === 'authenticated') {
      const effectiveUserId = userId || 'usr_emp_tala';
      const userObj = DEMO_USERS[effectiveUserId] || {
        id: effectiveUserId,
        name: 'Enterprise User',
        email: 'user@enterprise.com',
        role: 'employee' as const,
        avatar: '/default.png',
        department: 'Operations'
      };
      return {
        isAuthenticated: true,
        userId: effectiveUserId,
        token: token || `token-${effectiveUserId}`,
        user: userObj
      };
    }

    if (token && userId) {
      const userObj = DEMO_USERS[userId] || null;
      return {
        isAuthenticated: true,
        userId,
        token,
        user: userObj
      };
    }

    return { isAuthenticated: false, userId: null, token: null, user: null };
  } catch {
    return { isAuthenticated: false, userId: null, token: null, user: null };
  }
};

export interface AuthContextType {
  user: User | null;
  currentUser: User;
  token: string | null;
  isAuthenticated: boolean;
  currentPath: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  login: (credential: string, password?: string) => Promise<boolean>;
  loginWithUserId: (credential: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getStoredAuthInfo();

  const [user, setUser] = useState<User | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === to) {
      setCurrentPath(to);
      return;
    }
    if (options?.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    setCurrentPath(to);
    window.dispatchEvent(new Event('trace-route-change'));
  }, []);

  // Sync route changes with browser forward/back buttons and internal pushes
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('trace-route-change', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('trace-route-change', handleRouteChange);
    };
  }, []);

  // Multi-tab storage synchronization listener
  useEffect(() => {
    const handleStorageSync = () => {
      const stored = getStoredAuthInfo();
      if (stored.isAuthenticated && stored.user) {
        try {
          flushSync(() => {
            setUser(stored.user);
            setToken(stored.token);
            setIsAuthenticated(true);
          });
        } catch {
          setUser(stored.user);
          setToken(stored.token);
          setIsAuthenticated(true);
        }
      } else if (!stored.isAuthenticated) {
        try {
          flushSync(() => {
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          });
        } catch {
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('trace-auth-change', handleStorageSync);
    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('trace-auth-change', handleStorageSync);
    };
  }, []);

  const login = useCallback(async (credential: string, password?: string): Promise<boolean> => {
    const isEmail = credential.includes('@');
    const payload = isEmail
      ? { email: credential.trim(), password: password || undefined }
      : { user_id: credential.trim(), password: password || undefined };

    let userToSet: User | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        userToSet = data.user;
      }
    } catch {
      // Backend offline or unreachable fallback
    }

    if (!userToSet) {
      const matched = Object.values(DEMO_USERS).find(
        (u) => u.email.toLowerCase() === credential.trim().toLowerCase() || u.id === credential.trim()
      );

      if (matched) {
        if (matched.email.toLowerCase() === 'tala.malik@enterprise.com' && password && password !== 'Tala1243') {
          return false;
        }
        userToSet = matched;
      } else {
        const aliasMatched = DEMO_USERS[credential];
        if (aliasMatched) {
          userToSet = aliasMatched;
        }
      }
    }

    if (userToSet) {
      const resolvedUser: User = DEMO_USERS[userToSet.id]
        ? { ...DEMO_USERS[userToSet.id], ...userToSet }
        : userToSet;

      const generatedToken = `trace-token-${resolvedUser.id}-${Date.now()}`;

      // 1. Immediately save tokens & auth state in localStorage and sessionStorage
      try {
        localStorage.setItem(STORAGE_AUTH, 'authenticated');
        localStorage.setItem(STORAGE_USER, resolvedUser.id);
        localStorage.setItem(STORAGE_TOKEN, generatedToken);
        sessionStorage.setItem(STORAGE_AUTH, 'authenticated');
        sessionStorage.setItem(STORAGE_USER, resolvedUser.id);
        sessionStorage.setItem(STORAGE_TOKEN, generatedToken);
      } catch (err) {
        console.error('Failed to write auth storage:', err);
      }

      // 2. Synchronously update state to trigger immediate reactive re-render
      try {
        flushSync(() => {
          setUser(resolvedUser);
          setToken(generatedToken);
          setIsAuthenticated(true);
          setCurrentPath('/dashboard');
        });
      } catch {
        setUser(resolvedUser);
        setToken(generatedToken);
        setIsAuthenticated(true);
        setCurrentPath('/dashboard');
      }

      // 3. Update URL history and dispatch auth change event for reactive notification
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard');
        window.dispatchEvent(new CustomEvent('trace-auth-change', {
          detail: { isAuthenticated: true, user: resolvedUser, token: generatedToken }
        }));
        window.dispatchEvent(new Event('trace-route-change'));
      }

      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    // 1. Purge all storage immediately
    try {
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      sessionStorage.removeItem(STORAGE_USER);
      sessionStorage.removeItem(STORAGE_TOKEN);
      localStorage.setItem(STORAGE_AUTH, 'unauthenticated');
      sessionStorage.setItem(STORAGE_AUTH, 'unauthenticated');
    } catch (err) {
      console.error('Failed to clear auth storage:', err);
    }

    // 2. Synchronously update in-memory state
    try {
      flushSync(() => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setCurrentPath('/login');
      });
    } catch {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setCurrentPath('/login');
    }

    // 3. Route to /login immediately
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
      window.dispatchEvent(new CustomEvent('trace-auth-change', {
        detail: { isAuthenticated: false, user: null, token: null }
      }));
      window.dispatchEvent(new Event('trace-route-change'));
    }
  }, []);

  const currentUser: User = user || getStoredAuthInfo().user || DEMO_USERS.usr_emp_tala;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        token,
        isAuthenticated,
        currentPath,
        navigate,
        login,
        loginWithUserId: login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
