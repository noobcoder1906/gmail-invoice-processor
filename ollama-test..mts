import { generateFromOllama } from "./lib/ollama"; // adjust if your path is different

const runTest = async () => {
  const fakeInvoiceText = `
    Invoice Number: INV-00988
    Date: April 21, 2025
    Amount: ₹1299
    Vendor: Flipkart Wholesale
    Due Date: April 28, 2025
    GSTIN: 29ABCDE1234F2Z5
  `;

  const prompt = `
Extract the following fields from this invoice:
- vendorName
- invoiceNumber
- invoiceDate
- amount
- dueDate
- gstin

Respond in JSON format.

Content:
"""${fakeInvoiceText}"""
  `;

  const result = await generateFromOllama(prompt);
  console.log("🧾 Parsed Response:", result);
};

runTest();
