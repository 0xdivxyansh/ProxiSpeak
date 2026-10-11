import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onIdTokenChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithDemo: (username: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase client web configuration (uses env vars if present, otherwise defaults to public project config)
const firebaseApiKey =
  import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBuGI3z4-m0KCUlhHdkv71SpOWg7m6OQtI';
const firebaseAuthDomain =
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'proxispeak-f15c7.firebaseapp.com';
const firebaseProjectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID || 'proxispeak-f15c7';
const firebaseStorageBucket =
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'proxispeak-f15c7.firebasestorage.app';
const firebaseMessagingSenderId =
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '199296776920';
const firebaseAppId =
  import.meta.env.VITE_FIREBASE_APP_ID || '1:199296776920:web:3faff92b4cf4d0fec435ad';
const firebaseMeasurementId =
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-KTN6FTKD0N';

const isFirebaseConfigured = Boolean(firebaseApiKey && firebaseApiKey.length > 5);

let firebaseAuth: ReturnType<typeof getAuth> | null = null;
if (isFirebaseConfigured && getApps().length === 0) {
  const app = initializeApp({
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain,
    projectId: firebaseProjectId,
    storageBucket: firebaseStorageBucket,
    messagingSenderId: firebaseMessagingSenderId,
    appId: firebaseAppId,
    measurementId: firebaseMeasurementId,
  });
  firebaseAuth = getAuth(app);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('proxispeak_token') || null;
  });
  const [loading, setLoading] = useState(true);

  // Sync token with ApiClient
  useEffect(() => {
    apiClient.setTokenGetter(async () => {
      if (firebaseAuth?.currentUser) {
        return firebaseAuth.currentUser.getIdToken();
      }
      return token;
    });
  }, [token]);

  // Restore stored demo session or listen to Firebase Auth
  useEffect(() => {
    if (firebaseAuth) {
      const unsubscribe = onIdTokenChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('proxispeak_token', idToken);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            isDemo: false,
          });
        } else {
          // Check if there is a saved demo user
          const savedDemoUser = localStorage.getItem('proxispeak_demo_user');
          if (savedDemoUser) {
            try {
              const parsed = JSON.parse(savedDemoUser);
              setUser(parsed);
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('proxispeak_token');
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Demo mode fallback when Firebase client credentials are not configured yet
      const savedDemoUser = localStorage.getItem('proxispeak_demo_user');
      const savedToken = localStorage.getItem('proxispeak_token');
      if (savedDemoUser && savedToken) {
        try {
          setUser(JSON.parse(savedDemoUser));
          setToken(savedToken);
        } catch {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      throw new Error(
        'Firebase client configuration not found. Please check frontend/.env or use Quick Test Account!',
      );
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(firebaseAuth, provider);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    localStorage.setItem('proxispeak_token', idToken);
    setUser({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
      isDemo: false,
    });
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!firebaseAuth) {
      throw new Error(
        'Firebase client keys are not configured in frontend/.env. You can use the Quick Test/Demo Account option below to test immediately!',
      );
    }
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    localStorage.setItem('proxispeak_token', idToken);
    setUser({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
      isDemo: false,
    });
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!firebaseAuth) {
      throw new Error(
        'Firebase client keys are not configured in frontend/.env. You can use the Quick Test/Demo Account option below to test immediately!',
      );
    }
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    localStorage.setItem('proxispeak_token', idToken);
    setUser({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name.trim() || cred.user.email?.split('@')[0],
      isDemo: false,
    });
  };

  const signInWithDemo = (username: string) => {
    const cleanName = username.trim() || 'demo_explorer';
    const mockUid = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mockToken = `mock-token-${mockUid}`;
    const demoUser: AuthUser = {
      uid: mockUid,
      displayName: cleanName,
      email: `${mockUid}@example.com`,
      isDemo: true,
    };

    setToken(mockToken);
    setUser(demoUser);
    localStorage.setItem('proxispeak_token', mockToken);
    localStorage.setItem('proxispeak_demo_user', JSON.stringify(demoUser));
  };

  const signOut = async () => {
    if (firebaseAuth?.currentUser) {
      await fbSignOut(firebaseAuth);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('proxispeak_token');
    localStorage.removeItem('proxispeak_demo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithDemo,
        signOut,
      }}
    >
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
