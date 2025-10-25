import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeFirebaseAdmin(): Firestore {
  if (db) {
    return db;
  }

  try {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      // Get credentials from environment variable
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccount) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT environment variable is not set"
        );
      }

      const credentials = JSON.parse(serviceAccount);

      app = initializeApp({
        credential: cert(credentials),
      });
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestoreDB(): Firestore {
  if (!db) {
    return initializeFirebaseAdmin();
  }
  return db;
}

