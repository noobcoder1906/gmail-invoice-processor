"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<any | null>(null)
  const [status, setStatus] = useState("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !id) {
        console.error("❌ UID or ID missing", { uid: user?.uid, id })
        setLoading(false)
        return
      }

      const uid = user.uid
      try {
        const docRef = doc(db, "users", uid, "invoices", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          let parsed = data.parsedData
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed)
            } catch (e) {
              parsed = {}
            }
          }
          setInvoice({ ...data, parsed })
          setStatus(data.status)
        } else {
          console.warn("⚠️ Invoice not found in Firestore")
        }
      } catch (err) {
        console.error("❌ Error fetching invoice:", err)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [id])

  const handleApprove = () => {
    setStatus("approved")
    toast({ title: "Invoice Approved", description: "The invoice has been marked as approved." })
  }

  const handleReject = () => {
    setStatus("rejected")
    toast({ title: "Invoice Rejected", description: "The invoice has been marked as rejected." })
  }

  const handleDownload = () => {
    if (!invoice?.attachment) return
    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${invoice.attachment}`
    link.download = "invoice.pdf"
    link.click()
  }
  

  if (loading) return <div className="p-6">Loading invoice...</div>
  if (!invoice) return <div className="p-6 text-red-500">Invoice not found</div>

  const parsed = invoice.parsed || {}

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{parsed.vendor || "Unknown Vendor"}</h2>
                      <p className="text-muted-foreground">Invoice #{parsed.invoice_number || id}</p>
                    </div>
                    <Badge
                      className="capitalize"
                      variant={status === "approved" ? "success" : status === "rejected" ? "destructive" : "outline"}
                    >
                      {status}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount</p>
                      <p className="text-xl font-bold">{parsed.total_amount || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                      <p>{parsed.invoice_date || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                      <p>{parsed.due_date || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
                      <p>{parsed.gstin || "-"}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p>{parsed.description || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Email Details</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <p className="text-sm font-medium text-muted-foreground">From:</p>
                      <p>{invoice.from}</p>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                      <p>{invoice.subject}</p>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Received:</p>
                      <p>{invoice.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={handleApprove} disabled={status === "approved"}>
                      Approve Invoice
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleReject}
                      disabled={status === "rejected"}
                    >
                      Reject Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                  <div className="border rounded-lg p-4 flex items-center gap-3">
                    <div className="bg-muted rounded-lg p-2">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">invoice.pdf</p>
                      <p className="text-xs text-muted-foreground">PDF Attachment</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <p className="font-medium">Email Synced</p>
                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <p className="font-medium">Invoice Parsed by AI</p>
                        <p className="text-sm text-muted-foreground">{invoice.createdAt}</p>
                      </div>
                    </div>
                    {status !== "pending" && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div>
                          <p className="font-medium">Invoice {status === "approved" ? "Approved" : "Rejected"}</p>
                          <p className="text-sm text-muted-foreground">Just now</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
