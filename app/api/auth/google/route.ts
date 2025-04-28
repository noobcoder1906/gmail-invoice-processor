import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // This is a server-side route, but the actual Google auth happens client-side
    // This route is just a placeholder for the OAuth flow
    return NextResponse.json({ message: "Use client-side authentication" })
  } catch (error) {
    console.error("Error in Google auth route:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

