import dotenv from "dotenv";

dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

export const isFirebaseAuthConfigured = !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);

let firebaseAuth = null;

if (isFirebaseAuthConfigured) {
  try {
    const { initializeApp, getApps, getApp, cert } = await import("firebase-admin");
    const { getAuth } = await import("firebase-admin/auth");

    // Reuse the singleton app if another service (e.g. FCM) already initialized it.
    const app =
      getApps().length === 0
        ? initializeApp({
            credential: cert({
              projectId: PROJECT_ID,
              clientEmail: CLIENT_EMAIL,
              privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
          })
        : getApp();

    firebaseAuth = getAuth(app);
    console.log("[Firebase Auth] Admin SDK ready for ID token verification.");
  } catch (error) {
    console.error("[Firebase Auth] Failed to initialize Admin SDK:", error.message);
  }
} else {
  console.warn(
    "⚠️ Firebase Auth warning: service account env vars are not configured. Google Sign-In will be unavailable."
  );
}

/**
 * Verify a Firebase ID token issued to the client after a Google popup sign-in.
 * @param {string} idToken - The Firebase ID token from the frontend.
 * @returns {Promise<{uid: string, email: string, emailVerified: boolean, name: string, picture: string}>}
 * @throws {Error} when verification fails or Firebase is not configured.
 */
export const verifyFirebaseIdToken = async (idToken) => {
  if (!firebaseAuth) {
    throw new Error("Firebase authentication is not configured on the server.");
  }
  const decoded = await firebaseAuth.verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: decoded.email_verified === true,
    name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : "User"),
    picture: decoded.picture || "",
  };
};
