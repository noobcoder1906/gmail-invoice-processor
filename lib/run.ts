import { extractText } from './extractText';
import { generateFromOllama } from './generateFromOllama'; // Your existing function

async function main() {
  const filePath = './invoice.pdf'; // or ./image.png
  const rawText = await extractText(filePath);

  const prompt = `
Extract the following invoice details in JSON format:
- Invoice Number
- Date
- Amount
- Company Name
- GSTIN (if available)

Invoice Text:
${rawText}
`;

  const result = await generateFromOllama(prompt);
  console.log("Parsed Invoice JSON:", result);
}

main();
