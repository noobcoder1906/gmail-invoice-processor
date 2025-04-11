import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { adminDb } from "@/lib/firebase-admin";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
  try {
    console.log("🔁 Reached OAuth callback handler");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const uid = url.searchParams.get("state");

    console.log("📦 Params received:", { code, uid });

    if (!code || !uid) {
      console.error("❌ Missing code or uid in callback URL");
      return NextResponse.json({ error: "Missing code or uid" }, { status: 400 });
    }

    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Tokens received:", tokens);

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

    console.log(`🔥 Stored Gmail tokens for UID: ${uid}`);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?gmailConnected=true`);
  } catch (error: any) {
    console.error("❌ Error in Gmail OAuth callback:", error.message || error);
    return NextResponse.json({ error: "OAuth2 Callback Failed", details: error.message || error }, { status: 500 });
  }
}
