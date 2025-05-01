// lib/imap.ts
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { extractTextFromPDF } from "./ocr-extract";
import { processInvoiceWithAI } from "./processInvoiceWithAI";

export async function fetchEmailsViaIMAP({
  user,
  password,
  host,
  port = 993,
  tls = true,
}: {
  user: string;
  password: string;
  host: string;
  port?: number;
  tls?: boolean;
}) {
  return new Promise<void>((resolve, reject) => {
    const imap = new Imap({ user, password, host, port, tls });

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) return reject(err);

        const fetch = imap.search(["UNSEEN", ["SUBJECT", "Invoice"]], (err, results) => {
          if (err || !results.length) return resolve();

          const f = imap.fetch(results, { bodies: "", struct: true });

          f.on("message", (msg) => {
            msg.on("body", async (stream) => {
              const parsed = await simpleParser(stream);

              for (const att of parsed.attachments || []) {
                if (att.contentType.includes("pdf")) {
                  const pdfBuffer = att.content;
                  const text = await extractTextFromPDF(pdfBuffer);
                  const parsedInvoice = await processInvoiceWithAI(text);
                  // store in Firestore or DB
                }
              }
            });
          });

          f.once("end", () => {
            imap.end();
            resolve();
          });
        });
      });
    });

    imap.once("error", (err) => reject(err));
    imap.once("end", () => console.log("IMAP Connection closed"));
    imap.connect();
  });
}
