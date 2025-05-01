import Imap from "imap"
import { simpleParser } from "mailparser"
import { decrypt } from "./encryption"
import type { Readable } from "stream"

interface ImapConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
}

// Test IMAP connection with provided credentials
export function testImapConnection(config: ImapConfig): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config)

    imap.once("ready", () => {
      imap.end()
      resolve(true)
    })

    imap.once("error", (err: Error) => {
      reject(err)
    })

    imap.connect()
  })
}

// Fetch emails with attachments related to invoices
export async function fetchEmailsWithAttachments(config: ImapConfig, maxResults = 10): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config)
    const emails: any[] = []

    function openInbox(cb: (err: Error | null, box: Imap.Box) => void) {
      imap.openBox("INBOX", false, cb)
    }

    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) return reject(err)

        // Search for emails with attachments and invoice-related subjects
        const searchCriteria = [
          ["OR", ["SUBJECT", "invoice"], ["SUBJECT", "receipt"], ["SUBJECT", "payment"]],
          ["HEADER", "Content-Type", "pdf"],
        ]

        imap.search(searchCriteria, (err, results) => {
          if (err) return reject(err)
          if (!results || results.length === 0) return resolve([])

          // Limit results
          const limitedResults = results.slice(0, maxResults)

          const fetch = imap.fetch(limitedResults, {
            bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
            struct: true,
          })

          fetch.on("message", (msg, seqno) => {
            const email: any = {
              id: seqno.toString(),
              attachments: [],
            }

            msg.on("body", (stream, info) => {
              if (info.which === "HEADER.FIELDS (FROM TO SUBJECT DATE)") {
                simpleParser(stream as Readable, (err, parsed) => {
                  if (err) return console.error(err)
                  email.from = parsed.from?.text
                  email.subject = parsed.subject
                  email.date = parsed.date
                })
              }
            })

            msg.once("attributes", (attrs) => {
              const attachments: any[] = []
              const parts = attrs.struct || []

              // Find attachments in the email structure
              function findAttachmentParts(struct: any[], attachments: any[], prefix = "") {
                struct.forEach((item, i) => {
                  const disposition = item[2] || ""
                  const params = item[0] || {}

                  if (
                    Array.isArray(item) &&
                    (disposition.toLowerCase().indexOf("attachment") > -1 || params.toLowerCase().indexOf("pdf") > -1)
                  ) {
                    attachments.push({
                      partID: prefix ? `${prefix}.${i + 1}` : `${i + 1}`,
                      filename: item[1]?.name || `attachment-${i}`,
                      type: item[0],
                    })
                  }

                  if (Array.isArray(item[8])) {
                    findAttachmentParts(item[8], attachments, prefix ? `${prefix}.${i + 1}` : `${i + 1}`)
                  }
                })
              }

              findAttachmentParts(parts, attachments)

              if (attachments.length > 0) {
                email.attachments = attachments.map((att) => ({
                  filename: att.filename,
                  partID: att.partID,
                  messageId: attrs.uid,
                }))
              }
            })

            msg.once("end", () => {
              if (email.attachments.length > 0) {
                emails.push(email)
              }
            })
          })

          fetch.once("error", (err) => {
            reject(err)
          })

          fetch.once("end", () => {
            imap.end()
            resolve(emails)
          })
        })
      })
    })

    imap.once("error", (err) => {
      reject(err)
    })

    imap.connect()
  })
}

// Download a specific attachment from an email
export async function downloadAttachment(config: ImapConfig, messageId: number, partID: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config)
    let buffer = Buffer.alloc(0)

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err) => {
        if (err) return reject(err)

        const fetch = imap.fetch(messageId, {
          bodies: [partID],
          struct: true,
        })

        fetch.on("message", (msg) => {
          msg.on("body", (stream, info) => {
            stream.on("data", (chunk) => {
              buffer = Buffer.concat([buffer, chunk])
            })
          })
        })

        fetch.once("error", (err) => {
          reject(err)
        })

        fetch.once("end", () => {
          imap.end()
          resolve(buffer)
        })
      })
    })

    imap.once("error", (err) => {
      reject(err)
    })

    imap.connect()
  })
}

// Get IMAP config from stored credentials
export function getImapConfigFromCredentials(credentials: any): ImapConfig {
  return {
    user: credentials.email,
    password: decrypt(credentials.encryptedPassword),
    host: credentials.imapHost,
    port: Number.parseInt(credentials.imapPort),
    tls: true,
  }
}
