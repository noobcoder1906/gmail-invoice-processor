📩 AI-Powered Invoice Extractor from Gmail
This project is a full-stack application that connects to a user's Gmail account, fetches recent emails with invoice attachments (PDF), extracts key invoice data using AI, and stores the results in Firebase Firestore for structured tracking and invoice management.

🚀 Features
🔐 Google OAuth2 Integration – Securely connect and access Gmail inbox.

📬 Gmail API Access – Fetch emails with invoice-related PDF attachments.

📄 PDF Text Extraction – Uses pdf-parse to extract text from standard PDFs.

🔍 OCR Fallback with Tesseract.js – Handles image-only scanned invoices.

🧠 Google Gemini 1.5 Pro – Parses invoice text into structured JSON.

☁️ Firestore Integration – Stores parsed invoice data per user for frontend display.

🛡️ Robust Error Handling – Automatically falls back to OCR, handles API failures, and logs key debug info.

⚙️ IMAP/SMTP Email Settings – In the settings page, users can configure IMAP and SMTP credentials for non-Gmail accounts, enabling alternate invoice sync options.

🔄 Flexible Sync Options – After Gmail login, users can choose between:

Auto Gmail Sync (via Gmail API)

Manual email sync using IMAP or SMTP

🧠 Tech Stack
Frontend: Next.js (App Router)

Backend: Next.js API routes

AI: Gemini 1.5 Pro via Generative Language API

OCR: Tesseract.js

PDF Parsing: pdf-parse

Auth: Firebase Auth + Google Sign-In

Database: Firebase Firestore

Email Integration:

Gmail API (OAuth2)

IMAP/SMTP (manual sync option via settings)
