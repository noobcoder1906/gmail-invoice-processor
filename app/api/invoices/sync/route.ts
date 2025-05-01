import { type NextRequest, NextResponse } from "next/server"
import { gmail } from "@/lib/gmail"
import { adminDb } from "@/lib/firebase-admin"
import { extractTextFromPDF } from "@/lib/ocr-extract"
import { cleanOcrText } from "@/lib/utils"
import { generateFromOllama } from "@/lib/ollama"
import { fetchEmailsWithAttachments, downloadAttachment, getImapConfigFromCredentials } from "@/lib/imap-client"

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()
    if (!uid) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const userDoc = await adminDb.collection("users").doc(uid).get()
    const userData = userDoc.data()

    // Initialize arrays to store invoices from different sources
    const invoices: any[] = []
    let totalProcessed = 0

    // Process Gmail if connected
    if (userData?.gmailTokens) {
      const gmailInvoices = await processGmailInvoices(uid, userData)
      invoices.push(...gmailInvoices)
      totalProcessed += gmailInvoices.length
    }

    // Process IMAP email accounts if any are connected
    if (userData?.emailAccounts && userData.emailAccounts.length > 0) {
      for (const account of userData.emailAccounts) {
        try {
          const imapInvoices = await processImapInvoices(uid, account)
          invoices.push(...imapInvoices)
          totalProcessed += imapInvoices.length
        } catch (error) {
          console.error(`Error processing IMAP account ${account.email}:`, error)
          // Continue with other accounts even if one fails
        }
      }
    }

    // If no email accounts are connected
    if (!userData?.gmailTokens && (!userData?.emailAccounts || userData.emailAccounts.length === 0)) {
      return NextResponse.json({ error: "No email accounts connected" }, { status: 400 })
    }

    // Store all invoices in Firestore
    if (invoices.length > 0) {
      const batch = adminDb.batch()
      for (const invoice of invoices) {
        const ref = adminDb.collection("users").doc(uid).collection("invoices").doc(invoice.id)
        batch.set(ref, invoice)
      }
      await batch.commit()
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalProcessed} invoices from ${userData?.gmailTokens ? "Gmail" : ""} ${userData?.emailAccounts?.length ? `and ${userData.emailAccounts.length} other email accounts` : ""}`,
    })
  } catch (error) {
    console.error("❌ Error syncing invoices:", error)
    return NextResponse.json({ error: "Failed to sync invoices" }, { status: 500 })
  }
}

// Process invoices from Gmail
async function processGmailInvoices(uid: string, userData: any) {
  const invoices: any[] = []

  try {
    gmail.context._options.auth.setCredentials(userData.gmailTokens)

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "subject:(invoice OR receipt OR payment) has:attachment",
      maxResults: 10,
    })

    const messages = response.data.messages || []

    for (const message of messages) {
      const email = await gmail.users.messages.get({ userId: "me", id: message.id! })
      const headers = email.data.payload?.headers || []
      const subject = headers.find((h) => h.name === "Subject")?.value || ""
      const from = headers.find((h) => h.name === "From")?.value || ""
      const date = headers.find((h) => h.name === "Date")?.value || ""
      const parts = email.data.payload?.parts || []

      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: message.id!,
            id: part.body.attachmentId,
          })

          const pdfBuffer = Buffer.from(attachment.data.data || "", "base64")
          const invoice = await processInvoiceAttachment(message.id!, subject, from, date, pdfBuffer)
          invoices.push(invoice)
        }
      }
    }
  } catch (error) {
    console.error("Error processing Gmail invoices:", error)
  }

  return invoices
}

// Process invoices from IMAP email accounts
async function processImapInvoices(uid: string, accountData: any) {
  const invoices: any[] = []

  try {
    const imapConfig = getImapConfigFromCredentials(accountData)
    const emails = await fetchEmailsWithAttachments(imapConfig)

    for (const email of emails) {
      for (const attachment of email.attachments) {
        try {
          const pdfBuffer = await downloadAttachment(imapConfig, attachment.messageId, attachment.partID)

          const invoice = await processInvoiceAttachment(
            `${email.id}-${attachment.partID}`,
            email.subject,
            email.from,
            email.date,
            pdfBuffer,
          )

          invoices.push(invoice)
        } catch (attachmentError) {
          console.error("Error downloading attachment:", attachmentError)
        }
      }
    }
  } catch (error) {
    console.error("Error processing IMAP invoices:", error)
  }

  return invoices
}

// Common function to process invoice attachments from any source
async function processInvoiceAttachment(id: string, subject: string, from: string, date: string, pdfBuffer: Buffer) {
  let parsedText = "",
    description = ""

  try {
    const rawText = await extractTextFromPDF(pdfBuffer)
    const cleaned = cleanOcrText(rawText)

    const prompt = `
    You are a JSON invoice parser. Extract the following fields from this invoice text:
    
    Return ONLY valid JSON in this format:
    
    {
      "invoice_number": "",
      "invoice_date": "",
      "vendor": "",
      "vendor_address": "",
      "vendor_gstin": "",
      "vendor_pan": "",
      "client_name": "",
      "client_address": "",
      "client_gstin": "",
      "total_amount_inr": "",
      "total_amount_usd": "",
      "gst": "",
      "payment_status": "",
      "mode_of_payment": "",
      "transaction_id": "",
      "start_date": "",
      "end_date": "",
      "description": "",
      "line_items": [
        {
          "description": "",
          "quantity": "",
          "unit_price": "",
          "total": "",
          "cgst": "",
          "sgst": ""
        }
      ]
    }
    
    ⚠️ Guidelines:
    - Use real values only. Do not guess missing fields.
    - Format all numbers as string (e.g., "2,950.00").
    - Include vendor/client names, GSTIN, PAN, address.
    - Split amounts in INR and USD if mentioned.
    - Extract IFSC and SWIFT as mode_of_payment when bank is shown.
    - Parse table rows under "S.No." as line_items.
    - Dates must be in dd-mm-yyyy or yyyy-mm-dd format.
    - Generate a readable 'description' summary for this invoice.
    
    Text:
    """
    ${cleaned}
    """`

    // Try Gemini first
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    )

    const geminiJson = await geminiRes.json()
    parsedText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    // Fallback if Gemini fails
    if (!parsedText || !parsedText.includes("{")) {
      console.warn("⚠️ Falling back to Ollama...")
      parsedText = await generateFromOllama(prompt)
    }

    // Cleanup output
    parsedText = parsedText.replace(/```[a-z]*|```/gi, "").trim()
    const firstBrace = parsedText.indexOf("{")
    const lastBrace = parsedText.lastIndexOf("}")
    if (firstBrace !== -1 && lastBrace !== -1) {
      parsedText = parsedText.slice(firstBrace, lastBrace + 1)
    }

    const parsedJson = JSON.parse(parsedText)
    description = parsedJson.description || ""
  } catch (err) {
    console.error("❌ Parsing failed:", err)
    parsedText = "⚠️ Parsing failed"
    description = ""
  }

  return {
    id,
    emailId: id,
    subject,
    from,
    date,
    parsedData: parsedText,
    description,
    attachment: pdfBuffer.toString("base64"),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
}
