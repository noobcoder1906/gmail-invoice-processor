import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWorker } from "tesseract.js";
import pdf from "pdf-parse";

// Extract text from digital/text-based PDFs
export const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text?.trim();
    if (text && text.length >= 30) {
      console.log("📄 Extracted text from PDF directly");
      return text;
    } else {
      console.log("📄 PDF text too short, falling back to OCR...");
    }
  } catch (err) {
    console.warn("❌ PDF text extraction failed, using OCR...", (err as Error)?.message);
  }

  return await performOCR(pdfBuffer);
};

// Perform OCR on image-based PDFs or failed text-based ones
export const performOCR = async (pdfBuffer: Buffer): Promise<string> => {
  const timestamp = Date.now();
  const tempDir = path.join(process.cwd(), "temp");
  const tempPdf = path.join(tempDir, `invoice-${timestamp}.pdf`);
  const outputPngBase = path.join(tempDir, `invoice-${timestamp}`);
  const outputPng = `${outputPngBase}.png`;

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(tempPdf, pdfBuffer);

    await new Promise<void>((resolve, reject) =>
      exec(
        `pdftoppm -png -r 300 -singlefile "${tempPdf}" "${outputPngBase}"`,
        (err, stdout, stderr) => {
          if (stderr?.includes("Incorrect password")) {
            return reject(new Error("Encrypted PDF - Skipping"));
          }
          if (stderr?.includes("Couldn't read xref table")) {
            return reject(new Error("Corrupted PDF - Skipping"));
          }
          if (err) return reject(err);
          resolve();
        }
      )
    );

    if (!fs.existsSync(outputPng)) {
      throw new Error("PDF to PNG conversion failed - output file not created");
    }

    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const {
      data: { text },
    } = await worker.recognize(outputPng);

    await worker.terminate();
    console.log("🔍 OCR text extracted successfully");
    return text.trim();
  } catch (err: any) {
    console.error("❌ OCR failed:", err.message || err);
    return "";
  } finally {
    try {
      if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
      if (fs.existsSync(outputPng)) fs.unlinkSync(outputPng);
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Cleanup error:", cleanupErr);
    }
  }
};
