import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminDb } from "@/lib/firebase-admin"; // Firebase Admin SDK import

// Initialize the OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!, // Client ID from .env
  process.env.GOOGLE_CLIENT_SECRET!, // Client Secret from .env
  process.env.GOOGLE_REDIRECT_URI! // Redirect URI from .env (server-side only)
);

export async function GET(req: NextRequest) {
  try {
    console.log("🔁 Reached OAuth callback handler");

    // Extract code and UID from the callback URL
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const uid = url.searchParams.get("state");

    console.log("📦 Params received:", { code, uid });

    // Check if both code and uid are present
    if (!code || !uid) {
      console.error("❌ Missing code or uid in callback URL");
      return NextResponse.json({ error: "Missing code or uid" }, { status: 400 });
    }

    // Exchange the authorization code for access token
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Tokens received:", tokens);

    // Ensure tokens contain an access_token
    if (!tokens.access_token) {
      console.error("❌ No access token in response");
      return NextResponse.json({ error: "No access token received from Google" }, { status: 500 });
    }

    // Write to Firestore: users/{uid}/gmailTokens
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.set(
      {
        gmailConnected: true,
        gmailTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? "already-authorized",
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
        },
      },
      { merge: true }
    );

    console.log(`✅ Stored Gmail tokens for UID: ${uid}`);

    // Verify Firestore update (logging for debugging)
    const docSnap = await userRef.get();
    const docData = docSnap.data();
    console.log("🔎 Firestore doc after update:", docData);

    // Redirect to the settings page after successful connection
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?gmailConnected=true`);
  } catch (error: any) {
    console.error("❌ Error in Gmail OAuth callback:", error.message || error);
    return NextResponse.json({ error: "OAuth2 Callback Failed", details: error.message || error }, { status: 500 });
  }
}
