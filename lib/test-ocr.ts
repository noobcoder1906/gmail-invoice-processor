// test-ocr.ts
import { extractTextFromPDF } from './lib/ocr-extract';

extractTextFromPDF('absolute/path/to/INITN267891.pdf')
  .then((text) => console.log(text))
  .catch(console.error);
