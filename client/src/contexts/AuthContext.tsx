// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_admin: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ IMPORTANT: même clé que api.ts
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // api.ts lit déjà localStorage au constructor, mais ici on force cohérence si besoin
      api.setToken(token);
      fetchProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const { user: userData } = await api.getProfile();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem(TOKEN_KEY);
      api.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => {
    try {
      const { user: userData } = await api.signup(
        email,
        password,
        firstName,
        lastName,
        phone
      );
      setUser(userData);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: userData } = await api.login(email, password);
      setUser(userData);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await api.logout(); // clear token inside api.ts
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { user: updatedUser } = await api.updateProfile(updates);
      setUser(updatedUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
