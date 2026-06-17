/**
 * Browser-only Firebase client helpers.
 *
 * Firebase modules are imported dynamically so they are NOT bundled into the
 * initial page payload; they only load when a user actually triggers Google
 * sign-in (or FCM registration).
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => !!firebaseConfig.apiKey;

/**
 * Lazily initialize (or reuse) the Firebase app instance in the browser.
 */
async function getFirebaseApp() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

/**
 * Open the Google sign-in popup and return the resulting Firebase ID token.
 * This token is sent to our backend (`/api/v1/auth/google`) for verification.
 */
export async function signInWithGoogleGetIdToken(): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Google sign-in is not configured.");
  }

  const app = await getFirebaseApp();
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
