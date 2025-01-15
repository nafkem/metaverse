import { User } from '@/context/UserContext';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, getFirestore, query, serverTimestamp, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const usersCollection = collection(db, "users");

const checkExistence = async (field: string, value: string) => {
  const q = query(usersCollection, where(field, "==", value));
  try {
    const snapshot = await getDocs(q);
    return { success: true, exists: !snapshot.empty, snapshot };
  } catch (error) {
    console.error(`[Firebase] Error checking ${field}:`, error);
    return { success: false, error: `Unable to verify "${field}". Please check your network connection and try again.` };
  }
};

export const authenticateUser = async (username: string, walletId: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  console.log('[Firebase] Starting authentication:', { username, walletId });
  
  try {
    // First check if the wallet is registered with a different username
    const walletCheck = await checkExistence("walletId", walletId);
    if (!walletCheck.success) {
      return { success: false, error: walletCheck.error };
    }

    if (walletCheck.exists) {
      const walletData = walletCheck.snapshot.docs[0].data();
      if (walletData.username !== username) {
        return { 
          success: false, 
          error: "This wallet is already registered with a different username. Please use the correct username or connect a different wallet." 
        };
      }
      
      // Wallet exists with matching username - perform login
      console.log('[Firebase] Wallet found, logging in:', { username, walletId });
      return { 
        success: true, 
        user: { 
          uid: walletCheck.snapshot.docs[0].id, 
          username: walletData.username, 
          walletId: walletData.walletId 
        } 
      };
    }

    // Wallet not registered, check if username is available
    const usernameCheck = await checkExistence("username", username);
    if (!usernameCheck.success) {
      return { success: false, error: usernameCheck.error };
    }

    if (usernameCheck.exists) {
      return { 
        success: false, 
        error: "Username already exists. Please choose a different username." 
      };
    }

    // Create new account
    try {
      const docRef = await addDoc(usersCollection, {
        username,
        walletId,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      console.log('[Firebase] New account created:', { uid: docRef.id, username, walletId });
      return { 
        success: true, 
        user: { 
          uid: docRef.id, 
          username, 
          walletId 
        } 
      };
    } catch (error) {
      console.error('[Firebase] Error creating account:', error);
      throw new Error("Failed to create account. Please try again later.");
    }
  } catch (err) {
    console.error('[Firebase] Authentication error:', { error: err, username, walletId });
    
    if (err instanceof Error) {
      if (err.message.includes("permission-denied")) {
        return { 
          success: false, 
          error: "Authentication is currently unavailable. Please try again later or contact support." 
        };
      }
      if (err.message.includes("network")) {
        return { 
          success: false, 
          error: "Network error. Please check your internet connection and try again." 
        };
      }
      return { success: false, error: err.message };
    }
    return { 
      success: false, 
      error: "An unexpected error occurred. Please try again or contact support if the issue persists." 
    };
  }
};

export default app;
