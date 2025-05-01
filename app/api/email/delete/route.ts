import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

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

    // Filter out the account to delete
    const updatedAccounts = userData.emailAccounts.filter((account: any) => account.id !== accountId)

    // Update the user document
    await userRef.update({
      emailAccounts: updatedAccounts,
    })

    return NextResponse.json({ success: true, message: "Email account removed successfully" })
  } catch (error) {
    console.error("Error removing email account:", error)
    return NextResponse.json({ error: "Failed to remove email account" }, { status: 500 })
  }
}
