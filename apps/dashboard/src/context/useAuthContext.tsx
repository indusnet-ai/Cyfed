"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDemo } from './useDemoContext';

// ── Demo credentials store ──────────────────────────────────────────
// In production this would be validated against Supabase Auth / SSO.
export const DEMO_CREDENTIALS: Record<
  string,
  { password: string; role: 'admin' | 'analyst' | 'viewer'; email: string }
> = {
  Admin: {
    password: 'Admin@1245!',
    role: 'admin',
    email: 'admin@fedsoc.ai',
  },
  Security: {
    password: 'Security@1245!',
    role: 'analyst',
    email: 'security@fedsoc.ai',
  },
  Viewer: {
    password: 'Viewer@1245!',
    role: 'viewer',
    email: 'viewer@fedsoc.ai',
  },
};

interface UserSession {
  email: string;
  username: string;
}

interface AuthContextType {
  user: UserSession | null;
  role: 'admin' | 'analyst' | 'viewer';
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDemoMode } = useDemo();
  const [user, setUser] = useState<UserSession | null>(null);
  const [role, setRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const syncAuth = async () => {
      try {
        const storagePrefix = isDemoMode ? 'fedsoc_demo_' : 'fedsoc_';
        const storedUsername = localStorage.getItem(`${storagePrefix}username`);
        const storedEmail    = localStorage.getItem(`${storagePrefix}user`);
        const storedRole     = localStorage.getItem(`${storagePrefix}role`) as 'admin' | 'analyst' | 'viewer';

        if (storedUsername && storedEmail && storedRole) {
          setUser({ email: storedEmail, username: storedUsername });
          setRole(storedRole);
        }
      } catch (err) {
        console.error('Auth synchronization error:', err);
      } finally {
        setLoading(false);
      }
    };
    syncAuth();
  }, [isDemoMode]);

  // ── Login with username + password validation ──
  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cred = DEMO_CREDENTIALS[username];

      if (!cred) {
        return { success: false, error: 'Username not found.' };
      }
      if (cred.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      const { role: selectedRole, email } = cred;

      setUser({ email, username });
      setRole(selectedRole);

      const storagePrefix = isDemoMode ? 'fedsoc_demo_' : 'fedsoc_';
      localStorage.setItem(`${storagePrefix}username`, username);
      localStorage.setItem(`${storagePrefix}user`, email);
      localStorage.setItem(`${storagePrefix}role`, selectedRole);

      // Audit log
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_role: selectedRole,
          action: 'LOGIN',
          target: `User '${username}' logged in as ${selectedRole}`,
        }),
      });

      return { success: true };
    } catch (err) {
      console.error('Login action failed:', err);
      return { success: false, error: 'An unexpected error occurred.' };
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ──
  const logout = async () => {
    setLoading(true);
    try {
      const storagePrefix = isDemoMode ? 'fedsoc_demo_' : 'fedsoc_';

      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_role: role,
          action: 'LOGOUT',
          target: `User '${user?.username}' logged out`,
        }),
      });

      localStorage.removeItem(`${storagePrefix}username`);
      localStorage.removeItem(`${storagePrefix}user`);
      localStorage.removeItem(`${storagePrefix}role`);
      setUser(null);
      setRole('viewer');
    } catch (err) {
      console.error('Logout action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
