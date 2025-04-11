import { PDFDocument } from 'pdf-lib';

export const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const allText: string[] = [];

    for (const page of pages) {
      const textContent = await page.getTextContent?.(); // this works in some PDF readers but pdf-lib itself lacks getTextContent
      // pdf-lib doesn't support direct text extraction yet, so we fallback for now
      allText.push(`[Page ${pages.indexOf(page) + 1}] Text extraction not supported by pdf-lib`);
    }

    return allText.join('\n').trim();
  } catch (error) {
    console.error("❌ Failed to extract PDF text:", error);
    return "";
  }
};
