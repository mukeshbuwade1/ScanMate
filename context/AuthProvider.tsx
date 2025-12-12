import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

export type AuthUser = {
  id: string;
  email?: string;
  avatarUrl?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  useOfflineMode: () => void;
  isAnonymous: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const mapSession = useCallback((supaSession: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>>) => {
    const { session } = supaSession;
    setUser(
      session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? undefined,
            avatarUrl: (session.user.user_metadata as { avatar_url?: string })?.avatar_url,
          }
        : null,
    );
    setSession(
      session
        ? {
            accessToken: session.access_token,
            refreshToken: session.refresh_token ?? undefined,
            expiresAt: session.expires_at ? session.expires_at * 1000 : undefined,
          }
        : null,
    );
    setIsAnonymous(!session);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        mapSession({ session: data.session } as any);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        mapSession({ session } as any);
      } else {
        setUser(null);
        setSession(null);
        setIsAnonymous(true);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [mapSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setIsAnonymous(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setIsAnonymous(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAnonymous(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await supabase.auth.refreshSession();
  }, []);

  const useOfflineMode = useCallback(() => {
    setUser(null);
    setSession(null);
    setIsAnonymous(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshSession,
      useOfflineMode,
      isAnonymous,
    }),
    [isAnonymous, isLoading, refreshSession, session, signIn, signOut, signUp, useOfflineMode, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

