"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth } from "firebase/auth"
import { Avatar } from "@/components/ui/avatar"

interface Invoice {
  id: string
  subject: string
  from: string
  date: string
  status: string
  parsedData: string
  description?: string
  amount?: string
}

interface InvoiceCardProps {
  invoice: Invoice
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const router = useRouter()
  const { toast } = useToast()

  const updateStatus = async (status: "approved" | "rejected") => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("User not logged in")

      const invoiceRef = doc(db, "users", user.uid, "invoices", invoice.id)
      await updateDoc(invoiceRef, { status })

      toast({
        title: `Invoice ${status === "approved" ? "Approved" : "Rejected"}`,
        description: `${invoice.subject || "Invoice"} has been marked as ${status}.`,
      })
    } catch (err) {
      console.error("❌ Error updating status:", err)
      toast({
        title: "Failed to update invoice",
        description: "Try again later.",
        variant: "destructive",
      })
    }
  }

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus("approved")
  }

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus("rejected")
  }

  const handleCardClick = () => {
    router.push(`/invoice/${invoice.id}`)
  }

  let parsed: any = {}
  try {
    parsed = JSON.parse(invoice.parsedData)
  } catch {
    parsed = null
  }

  // Extract vendor information
  const vendor = parsed?.vendor || invoice.from
  const amount = parsed?.total || invoice.amount || "$0.00"
  const invoiceId = invoice.id

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md border border-white-100"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center">
          <Avatar className="h-12 w-12 mr-4">
            <div className="bg-white-200 h-full w-full rounded-full flex items-center justify-center text-white-600 font-medium">
              {vendor.charAt(0).toUpperCase()}
            </div>
          </Avatar>
          <div className="flex-grow">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-white-900">{vendor}</h3>
              <Badge
                className="capitalize"
                variant={
                  invoice.status === "approved"
                    ? "success"
                    : invoice.status === "rejected"
                    ? "destructive"
                    : "outline"
                }
              >
                {invoice.status}
              </Badge>
            </div>
            <p className="text-xs text-white-500">ID: #{invoiceId}</p>
          </div>
        </div>

        {invoice.status === "pending" && (
          <div className="mt-4 flex gap-2 justify-end">
            <Button size="sm" className="h-8" onClick={handleApprove}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={handleReject}>
              Reject
            </Button>
          </div>
        )}

        {invoice.status !== "pending" && (
          <div className="mt-4 flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/invoice/${invoice.id}`)
              }}
            >
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}