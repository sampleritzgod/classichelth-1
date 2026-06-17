import dotenv from "dotenv";

dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

const isFCMConfigured = !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
let fcmMessaging = null;

if (isFCMConfigured) {
  try {
    const { initializeApp, getApps, getApp, cert } = await import("firebase-admin");
    const { getMessaging } = await import("firebase-admin/messaging");
    
    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail: CLIENT_EMAIL,
          privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      app = getApp();
    }
    fcmMessaging = getMessaging(app);
    console.log("[FCM Service] Firebase Admin SDK successfully initialized.");
  } catch (error) {
    console.error("[FCM Service] Failed to initialize Firebase Admin SDK:", error.message);
  }
} else {
  console.warn(
    "⚠️ FCM Service warning: Firebase Cloud Messaging credentials are not configured. Running FCM in MOCK mode (logging pushes to console)."
  );
}

/**
 * Sends a real-time browser push notification via FCM.
 * Falls back to console log traces if FCM is not configured.
 * 
 * @param {string|Array<string>} tokens - Target registration token(s)
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Payload data (e.g. redirect URLs, appointment IDs)
 */
export const sendPushDirect = async (tokens, title, body, data = {}) => {
  const targetTokens = Array.isArray(tokens) ? tokens : [tokens];
  
  // Clean empty or invalid tokens
  const cleanTokens = targetTokens.filter(t => typeof t === "string" && t.trim() !== "");
  
  if (cleanTokens.length === 0) {
    return { success: false, reason: "no_valid_tokens" };
  }

  if (isFCMConfigured && fcmMessaging) {
    try {
      const response = await fcmMessaging.sendEachForMulticast({
        tokens: cleanTokens,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          // All data fields in FCM v1 payload must be strings
          click_action: data.click_action || "/profile", 
        },
      });
      
      console.log(`[FCM Service] Multicast push dispatched. Success: ${response.successCount}, Fail: ${response.failureCount}`);
      return response;
    } catch (error) {
      console.error("[FCM Service] Error sending push notification:", error);
      throw error;
    }
  } else {
    console.log("\n================ [MOCK BROWSER PUSH OUTBOX] ================");
    console.log(`Tokens count: ${cleanTokens.length}`);
    console.log(`Tokens:       ${cleanTokens.join(", ")}`);
    console.log(`Title:        ${title}`);
    console.log(`Body:         ${body}`);
    console.log(`Payload data: ${JSON.stringify(data, null, 2)}`);
    console.log("============================================================\n");
    return { mock: true, successCount: cleanTokens.length, failureCount: 0 };
  }
};
