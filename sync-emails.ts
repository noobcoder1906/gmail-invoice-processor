import { gmail } from "@/lib/gmail";
import { adminDb } from "@/lib/firebase-admin";
import { extractTextFromPDF, performOCR } from "@/lib/ocr";
import { cleanOcrText } from "@/lib/utils";
import { generateFromOllama } from "@/lib/fetch";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const uid = "8lxbdXoYh9TnytL6UxNSnkg0cVx2"; // 👈 Replace with real user UID

const run = async () => {
  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.gmailTokens) {
      throw new Error("❌ Gmail not connected for UID: " + uid);
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:3000/api/oauth2callback"
    );

    oAuth2Client.setCredentials(userData.gmailTokens);
    gmail.context._options.auth = oAuth2Client;

    console.log("🔑 Gmail credentials set for UID:", uid);

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "subject:(invoice OR receipt OR payment) has:attachment",
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    const invoices: any[] = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({ userId: "me", id: message.id! });

      const headers = email.data.payload?.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      const date = headers.find(h => h.name === "Date")?.value || "";
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
            let rawText = await extractTextFromPDF(pdfBuffer);

            if (!rawText || rawText.length < 30) {
              console.log("🧪 No text found, running OCR...");
              try {
                rawText = await performOCR(pdfBuffer);
              } catch (ocrError: any) {
                if (ocrError.message?.includes("Encrypted PDF") || ocrError.message?.includes("Corrupted PDF")) {
                  console.warn("🔒 Skipping unreadable PDF:", message.id, "|", ocrError.message);
                  continue;
                }
                throw ocrError;
              }
            }

            const cleaned = cleanOcrText(rawText);

            const prompt = `
You are a JSON-only extraction engine. Extract these fields from the invoice text below.

Return exactly this JSON format:

{
  "invoice_number": "",
  "vendor": "",
  "invoice_date": "",
  "due_date": "",
  "total_amount": "",
  "gst": "",
  "payment_status": "",
  "mode_of_payment": "",
  "transaction_id": "",
  "start_date": "",
  "end_date": ""
}

If a field is not found, leave it as an empty string.
Do not explain or add bullet points. Only return JSON.

Invoice Text:
"""
${cleaned}
"""`;

            parsedText = await generateFromOllama(prompt);

            // Clean Ollama response
            parsedText = parsedText.replace(/```[a-z]*|```/gi, "").trim();
            const firstBrace = parsedText.indexOf("{");
            const lastBrace = parsedText.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              parsedText = parsedText.slice(firstBrace, lastBrace + 1);
            }

            try {
              JSON.parse(parsedText);
            } catch {
              console.warn("⚠️ Invalid JSON returned by Ollama:\n", parsedText);
              parsedText = "⚠️ Invalid JSON returned by Ollama";
            }
          } catch (err) {
            console.error("❌ OCR + Ollama failed:", err);
            parsedText = "{}";
          }

          invoices.push({
            id: message.id,
            emailId: message.id,
            subject,
            from,
            date,
            parsedData: parsedText,
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
    console.log(`✅ Synced ${invoices.length} invoices.`);
  } catch (err) {
    console.error("❌ Error syncing invoices:", err);
  }
};

run();
