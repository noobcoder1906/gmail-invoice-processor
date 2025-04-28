import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  }

  throw new Error('Unsupported file type');
}
