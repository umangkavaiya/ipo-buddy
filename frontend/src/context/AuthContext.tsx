"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { api, UserProfile, setClerkTokenGetter } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSignedIn: boolean;
  login: () => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const { openSignIn, signOut } = useClerk();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure api client with Clerk token getter
  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenGetter(() => getToken());
    } else {
      setClerkTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  const refreshProfile = async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      const clerkFriendlyName =
        clerkUser?.fullName ||
        clerkUser?.firstName ||
        (clerkEmail ? clerkEmail.split("@")[0] : null) ||
        "Investor";

      const profile = await api.getProfile();
      const isRawId = !profile.displayName || profile.displayName.startsWith("user_");
      const cleanDisplayName = isRawId ? clerkFriendlyName : profile.displayName;

      if (isRawId) {
        api
          .updateProfile({
            displayName: cleanDisplayName,
            email: clerkEmail || undefined,
          })
          .catch(() => {});
      }

      setUser({
        ...profile,
        displayName: cleanDisplayName,
        email: clerkEmail || profile.email,
      });
    } catch (err) {
      console.warn("Could not sync profile with .NET backend yet:", err);
      // Fallback local representation while backend spins up
      if (clerkUser) {
        const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
        const clerkFriendlyName =
          clerkUser.fullName ||
          clerkUser.firstName ||
          (clerkEmail ? clerkEmail.split("@")[0] : null) ||
          "Investor";

        setUser({
          id: clerkUser.id,
          displayName: clerkFriendlyName,
          email: clerkEmail || "",
          phone: null,
          subscriptionTier: "FREE",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        refreshProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const login = () => {
    openSignIn();
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !isLoaded || loading,
        isSignedIn: !!isSignedIn,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
