import { type NextRequest, NextResponse } from "next/server"
import { extractTextFromPDF } from "@/lib/ocr-extract"
import { OpenAI } from "openai"

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text from file
    let extractedText = ""

    if (file.type === "application/pdf") {
      extractedText = await extractTextFromPDF(buffer)
    } else if (file.type.startsWith("image/")) {
      // For image files, use Tesseract OCR
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")
      const { data } = await worker.recognize(buffer)
      extractedText = data.text
      await worker.terminate()
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    if (!extractedText) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 })
    }

    // Process with AI
    const prompt = `Extract the following fields from this invoice text:
- invoice_number: The invoice ID or reference number
- vendor: The company or person who issued the invoice
- invoice_date: When the invoice was issued
- due_date: When payment is due
- total_amount: The total amount to be paid
- tax_details: Any tax information (GST, VAT, etc.)
- payment_terms: Payment terms if mentioned
- currency: The currency used

Return ONLY valid JSON with these fields. If a field is not found, leave it as an empty string.

Invoice text:
"""
${extractedText.substring(0, 4000)}
"""`

    let parsedData

    if (openai) {
      // Use OpenAI if available
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an invoice data extraction assistant. Extract structured data from invoice text and return it as valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      })

      parsedData = completion.choices[0]?.message?.content || "{}"
    } else {
      // Fallback to local model
      const { generateFromOllama } = await import("@/lib/ollama")
      parsedData = await generateFromOllama(prompt)
    }

    // Ensure we have valid JSON
    let jsonData
    try {
      // Clean up any non-JSON content
      if (typeof parsedData === "string") {
        if (parsedData.includes("```")) {
          parsedData = parsedData.replace(/```[a-z]*|```/gi, "").trim()
        }

        const firstBrace = parsedData.indexOf("{")
        const lastBrace = parsedData.lastIndexOf("}")

        if (firstBrace !== -1 && lastBrace !== -1) {
          parsedData = parsedData.slice(firstBrace, lastBrace + 1)
        }
      }

      jsonData = JSON.parse(typeof parsedData === "string" ? parsedData : "{}")
    } catch (jsonError) {
      console.error("❌ Invalid JSON returned:", jsonError)
      jsonData = {
        invoice_number: "",
        vendor: "",
        invoice_date: "",
        due_date: "",
        total_amount: "",
        tax_details: "",
        payment_terms: "",
        currency: "",
      }
    }

    return NextResponse.json(jsonData)
  } catch (error) {
    console.error("❌ Error parsing invoice:", error)
    return NextResponse.json({ error: "Failed to parse invoice" }, { status: 500 })
  }
}
