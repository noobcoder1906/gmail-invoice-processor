import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
dotenv.config(); // ✅ Load variables from .env

const decodedKey = process.env.FIREBASE_PRIVATE_KEY!
  .replace(/\\n/g, '\n')          // Turns \n into real line breaks
  .replace(/^"(.*)"$/, '$1');     // Removes wrapping quotes if any

// Initialize Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: decodedKey,
  }),
};

const app = !getApps().length ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };

console.log("🔐 FIRST 30 of KEY:", process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30));
console.log("🔐 LAST 30 of KEY:", process.env.FIREBASE_PRIVATE_KEY?.slice(-30));
