import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { testImapConnection, getImapConfigFromCredentials } from "@/lib/imap-client"

export async function POST(request: NextRequest) {
  try {
    const { uid, accountId } = await request.json()

    if (!uid || !accountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user document
    const userRef = adminDb.collection("users").doc(uid)
    const userDoc = await userRef.get()
    const userData = userDoc.data()

    if (!userData || !userData.emailAccounts) {
      return NextResponse.json({ error: "No email accounts found" }, { status: 404 })
    }

    // Find the account to test
    const account = userData.emailAccounts.find((acc: any) => acc.id === accountId)

    if (!account) {
      return NextResponse.json({ error: "Email account not found" }, { status: 404 })
    }

    // Test the connection
    try {
      const imapConfig = getImapConfigFromCredentials(account)
      await testImapConnection(imapConfig)

      return NextResponse.json({ success: true, message: "Connection successful" })
    } catch (error: any) {
      return NextResponse.json({ error: `Connection failed: ${error.message}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error testing email connection:", error)
    return NextResponse.json({ error: "Failed to test connection" }, { status: 500 })
  }
}
