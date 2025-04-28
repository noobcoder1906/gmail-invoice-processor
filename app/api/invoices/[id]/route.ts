import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = request.nextUrl.searchParams
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const invoiceDoc = await adminDb.collection("users").doc(uid).collection("invoices").doc(params.id).get()

    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ invoice: invoiceDoc.data() })
  } catch (error) {
    console.error("Error getting invoice:", error)
    return NextResponse.json({ error: "Failed to get invoice" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { uid, status } = await request.json()

    if (!uid || !status) {
      return NextResponse.json({ error: "User ID and status are required" }, { status: 400 })
    }

    // Update invoice status
    await adminDb.collection("users").doc(uid).collection("invoices").doc(params.id).update({
      status,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

