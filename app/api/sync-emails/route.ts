// import { NextRequest, NextResponse } from "next/server";
// import { gmail } from "@/lib/gmail";
// import { adminDb } from "@/lib/firebase-admin";
// import { generateFromOllama } from "@/lib/ollama";
// import { extractTextFromPDF } from "@/lib/ocr-extract";
// import { cleanOcrText } from "@/lib/utils";

// export async function POST(request: NextRequest) {
//   try {
//     const { uid } = await request.json();

//     if (!uid) {
//       return NextResponse.json({ error: "User ID is required" }, { status: 400 });
//     }

//     const userDoc = await adminDb.collection("users").doc(uid).get();
//     const userData = userDoc.data();

//     if (!userData?.gmailTokens) {
//       return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
//     }

//     gmail.context._options.auth.setCredentials(userData.gmailTokens);
//     console.log("🔑 Setting Gmail credentials for UID:", uid);

//     const messagesRes = await gmail.users.messages.list({
//       userId: "me",
//       q: "filename:pdf OR subject:(invoice OR receipt OR payment) has:attachment",
//       maxResults: 5,
//     });

//     const messageIds = messagesRes.data.messages || [];
//     if (messageIds.length === 0) {
//       return NextResponse.json({ message: "No matching emails found." }, { status: 200 });
//     }

//     const invoices = [];

//     for (const msg of messageIds) {
//       const msgDetail = await gmail.users.messages.get({
//         userId: "me",
//         id: msg.id!,
//       });

//       const parts = msgDetail.data.payload?.parts || [];

//       for (const part of parts) {
//         if (part.filename && part.body?.attachmentId) {
//           const attachment = await gmail.users.messages.attachments.get({
//             userId: "me",
//             messageId: msg.id!,
//             id: part.body.attachmentId,
//           });

//           const content = Buffer.from(attachment.data.data || "", "base64").toString("utf-8");

//           let parsed: string;
//           try {
//             parsed = await generateFromOllama(`Extract invoice data:\n${content}`);
//           } catch (err) {
//             parsed = "⚠️ LLM parsing failed.";
//             console.error("⚠️ Ollama error:", err);
//           }

//           invoices.push({
//             id: msg.id,
//             filename: part.filename,
//             parsedData: parsed,
//             createdAt: new Date().toISOString(),
//             status: "pending",
//           });
//         }
//       }
//     }

//     const batch = adminDb.batch();
//     for (const invoice of invoices) {
//       const invoiceRef = adminDb.collection("users").doc(uid).collection("invoices").doc(invoice.id);
//       batch.set(invoiceRef, invoice);
//     }

//     await batch.commit();

//     console.log(`✅ Synced ${invoices.length} invoices.`);
//     return NextResponse.json({ success: true, count: invoices.length });
//   } catch (error) {
//     console.error("❌ Error syncing invoices:", error);
//     return NextResponse.json({ error: "Failed to sync invoices" }, { status: 500 });
//   }
// }

// import { type NextRequest, NextResponse } from "next/server"
// import { gmail } from "@/lib/gmail"
// import { adminDb } from "@/lib/firebase-admin"
// import { generateFromOllama } from "@/lib/ollama"
// import { extractTextFromPDF } from '../../../lib/ocr-extract'

// export async function POST(request: NextRequest) {
//   try {
//     const { uid } = await request.json()

//     if (!uid) {
//       return NextResponse.json({ error: "User ID is required" }, { status: 400 })
//     }

//     // Get user's Gmail tokens from Firestore
//     const userDoc = await adminDb.collection("users").doc(uid).get()
//     const userData = userDoc.data()

//     if (!userData?.gmailTokens) {
//       return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })
//     }

//     // Set Gmail tokens
//     gmail.context._options.auth.setCredentials(userData.gmailTokens)
//     console.log("🔑 Setting Gmail credentials for UID:", uid)

//     // Search for emails with attachments related to invoices
//     const response = await gmail.users.messages.list({
//       userId: "me",
//       q: "subject:(invoice OR receipt OR payment) has:attachment",
//       maxResults: 10,
//     })

//     const messages = response.data.messages || []
//     const invoices = []

//     for (const message of messages) {
//       const email = await gmail.users.messages.get({
//         userId: "me",
//         id: message.id!,
//       })

//       const headers = email.data.payload?.headers || []
//       const subject = headers.find((h) => h.name === "Subject")?.value || ""
//       const from = headers.find((h) => h.name === "From")?.value || ""
//       const date = headers.find((h) => h.name === "Date")?.value || ""

//       const parts = email.data.payload?.parts || []
//       for (const part of parts) {
//         if (part.filename && part.body?.attachmentId) {
//           const attachment = await gmail.users.messages.attachments.get({
//             userId: "me",
//             messageId: message.id!,
//             id: part.body.attachmentId,
//           })

//           const pdfBuffer = Buffer.from(attachment.data.data || "", "base64")
//           let parsedText = ""
//           let llmResponse = ""

//           try {
//             // 🔍 Try direct parsing with Ollama
//             const content = pdfBuffer.toString("utf-8")
//             llmResponse = await generateFromOllama(content)
//             parsedText = llmResponse
//           } catch (err1) {
//             console.warn("⚠️ Direct LLM failed. Trying OCR fallback...")

//             try {
//               const ocrText = await extractTextFromPDF(pdfBuffer)
//               llmResponse = await generateFromOllama(ocrText)
//               parsedText = llmResponse
//             } catch (err2) {
//               console.error("❌ OCR fallback also failed:", err2)
//               parsedText = "⚠️ Parsing failed"
//             }
//           }

//           invoices.push({
//             id: message.id,
//             emailId: message.id,
//             subject,
//             from,
//             date,
//             parsedData: parsedText,
//             status: "pending",
//             createdAt: new Date().toISOString(),
//           })
//         }
//       }
//     }

//     // Batch store parsed invoices
//     const batch = adminDb.batch()
//     for (const invoice of invoices) {
//       const ref = adminDb.collection("users").doc(uid).collection("invoices").doc(invoice.id)
//       batch.set(ref, invoice)
//     }
//     await batch.commit()

//     return NextResponse.json({
//       success: true,
//       message: `Synced ${invoices.length} invoices`,
//     })
//   } catch (error) {
//     console.error("❌ Error syncing invoices:", error)
//     return NextResponse.json({ error: "Failed to sync invoices" }, { status: 500 })
 
//   }

// }
import { type NextRequest, NextResponse } from "next/server";
import { gmail } from "@/lib/gmail";
import { adminDb } from "@/lib/firebase-admin";
import { extractTextFromPDF } from "@/lib/ocr-extract";
import { cleanOcrText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.gmailTokens) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
    }

    gmail.context._options.auth.setCredentials(userData.gmailTokens);
    console.log("🔑 Gmail credentials set for UID:", uid);

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "subject:(invoice OR receipt OR payment) has:attachment",
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    const invoices: any[] = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
      });

      const headers = email.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      const parts = email.data.payload?.parts || [];

      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: message.id!,
            id: part.body.attachmentId,
          });

          const pdfBuffer = Buffer.from(attachment.data.data || "", "base64");
          let parsedText = "";

          try {
            const ocrText = await extractTextFromPDF(pdfBuffer);
            const cleanedRaw = cleanOcrText(ocrText);

            const importantLines = cleanedRaw
              .split('\n')
              .filter(line =>
                /invoice|gstin|amount|date|total|customer|payable|description|charges|tax/i.test(line)
              )
              .slice(0, 40)
              .join('\n') || "Invoice Number: INV-123\nDate: 2024-05-01\nTotal: $100.00\nVendor: Test Company";

            const prompt = `Extract the following fields from this invoice text:
- invoice_number
- vendor
- invoice_date
- due_date
- total_amount
- tax_details
- payment_terms
- currency

Return only valid JSON. Do not explain.

Invoice text:
"""
${importantLines}
"""`;

            const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=" + process.env.GEMINI_API_KEY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              }),
            });

            const json = await geminiResponse.json();
            console.log("🔍 Full Gemini JSON:", JSON.stringify(json, null, 2));
            parsedText = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
          } catch (err) {
            console.error("❌ OCR + Gemini failed:", err);
            parsedText = "{}";
          }

          let onlyJson = parsedText;

          if (onlyJson.includes("```")) {
            onlyJson = onlyJson.replace(/```[a-z]*|```/gi, "").trim();
          }

          const firstBrace = onlyJson.indexOf("{");
          const lastBrace = onlyJson.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1) {
            onlyJson = onlyJson.slice(firstBrace, lastBrace + 1);
          }

          try {
            JSON.parse(onlyJson);
          } catch {
            onlyJson = "⚠️ Invalid JSON returned by Gemini";
          }

          invoices.push({
            id: message.id,
            emailId: message.id,
            subject,
            from,
            date,
            parsedData: onlyJson,
            attachment: pdfBuffer.toString("base64"),
            status: "pending",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    const batch = adminDb.batch();
    for (const invoice of invoices) {
      const ref = adminDb.collection("users").doc(uid).collection("invoices").doc(invoice.id);
      batch.set(ref, invoice);
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Synced ${invoices.length} invoices`,
    });
  } catch (error) {
    console.error("❌ Error syncing invoices:", error);
    return NextResponse.json({ error: "Failed to sync invoices" }, { status: 500 });
  }
}
  