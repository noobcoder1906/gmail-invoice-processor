# 📩 AI-Powered Invoice Extractor from Gmail

This project is a full-stack application that connects to a user's Gmail account, fetches recent emails with invoice attachments (PDF), extracts key invoice data using AI, and stores the results in Firebase Firestore for structured tracking.

---

## 🚀 Features

- 🔐 **Google OAuth2 Integration** – Securely connect and access Gmail inbox.
- 📬 **Gmail API Access** – Fetch emails with invoice-related PDF attachments.
- 📬**IMAP and SMTP** – Fetch emails with invoice-related PDF attachments.
- 📄 **PDF Text Extraction** – Uses `pdf-parse` to extract text from standard PDFs.
- 🔍 **OCR Fallback with Tesseract.js** – Handles image-only scanned invoices.
- 🧠 **Google Gemini 1.5 Pro** – Parses invoice text into structured JSON.
- ☁️ **Firestore Integration** – Stores parsed invoice data per user for frontend display.
- 🛡️ **Robust Error Handling** – Automatically falls back to OCR, handles API failures, and logs key debug info.

---

## 🧠 Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js API routes
- **AI**: Gemini 1.5 Pro via Generative Language API
- **OCR**: Tesseract.js
- **PDF Parsing**: pdf-parse
- **Auth**: Firebase Auth + Google Sign-In
- **Database**: Firebase Firestore
- **Email Integration**: Gmail API (Google OAuth2) , Imap and smtp connections.

---

add also that there are smtp and imap connectivity in settings page. once user is authenticated via gmail they can either sync their gmail invoices or use imap or smpt 
