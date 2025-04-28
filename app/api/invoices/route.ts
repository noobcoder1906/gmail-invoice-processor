import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const uid = searchParams.get("uid")
    const status = searchParams.get("status")

    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = adminDb.collection("users").doc(uid).collection("invoices").orderBy("createdAt", "desc")

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.where("status", "==", status)
    }

    const snapshot = await query.get()

    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error getting invoices:", error)
    return NextResponse.json({ error: "Failed to get invoices" }, { status: 500 })
  }
}

