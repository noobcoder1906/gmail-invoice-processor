import { google } from "googleapis"

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI! // ✅ server-side secret
);

  
// Set credentials
oauth2Client.setCredentials({
  refresh_token: process.env.NEXT_PUBLIC_GOOGLE_REFRESH_TOKEN,
  access_token: process.env.NEXT_PUBLIC_GOOGLE_ACCESS_TOKEN,
})

// Create Gmail API client
const gmail = google.gmail({ version: "v1", auth: oauth2Client })

export { gmail, oauth2Client }

