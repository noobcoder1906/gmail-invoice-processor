import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { encrypt } from "@/lib/encryption"
import { testImapConnection } from "@/lib/imap-client"

export async function POST(request: NextRequest) {
  try {
    const { uid, email, password, provider, imapHost, imapPort, smtpHost, smtpPort } = await request.json()

    if (!uid || !email || !password || !imapHost || !imapPort) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Test the IMAP connection before saving credentials
    try {
      await testImapConnection({
        user: email,
        password,
        host: imapHost,
        port: Number.parseInt(imapPort),
        tls: true,
      })
    } catch (error: any) {
      console.error("IMAP connection test failed:", error)
      return NextResponse.json({ error: `Failed to connect to email server: ${error.message}` }, { status: 400 })
    }

    // Encrypt sensitive data before storing
    const encryptedPassword = encrypt(password)

    // Store email credentials in Firestore
    const userRef = adminDb.collection("users").doc(uid)

    // Get existing email accounts
    const userDoc = await userRef.get()
    const userData = userDoc.data() || {}
    const existingAccounts = userData.emailAccounts || []

    // Check if this email already exists
    const emailExists = existingAccounts.some((account: any) => account.email === email)

    if (emailExists) {
      return NextResponse.json({ error: "This email account is already connected" }, { status: 400 })
    }

    // Add new email account
    await userRef.update({
      emailAccounts: [
        ...existingAccounts,
        {
          id: Date.now().toString(),
          email,
          provider,
          imapHost,
          imapPort,
          smtpHost,
          smtpPort,
          encryptedPassword,
          addedAt: new Date().toISOString(),
        },
      ],
    })

    return NextResponse.json({ success: true, message: "Email account connected successfully" })
  } catch (error) {
    console.error("Error connecting email account:", error)
    return NextResponse.json({ error: "Failed to connect email account" }, { status: 500 })
  }
}
