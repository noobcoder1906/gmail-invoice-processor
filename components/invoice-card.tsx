"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth } from "firebase/auth"

interface Invoice {
  id: string
  vendor: string
  amount: string
  date: string
  status: string
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
        description: `${invoice.vendor} invoice has been marked as ${status}.`,
      })
    } catch (err) {
      console.error("❌ Error updating status:", err)
      toast({ title: "Failed to update invoice", description: "Try again later.", variant: "destructive" })
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

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between md:hidden">
              <h3 className="font-semibold">{invoice.vendor}</h3>
              <p className="font-bold">{invoice.amount}</p>
            </div>
            <h3 className="font-semibold hidden md:block">{invoice.vendor}</h3>
            <p className="text-sm text-muted-foreground">{invoice.date}</p>
          </div>

          <div className="hidden md:block text-right">
            <p className="font-bold">{invoice.amount}</p>
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

          <div className="flex md:flex-col gap-2 md:w-[120px]">
            {invoice.status === "pending" ? (
              <>
                <Button size="sm" className="flex-1 md:w-full" onClick={handleApprove}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 md:w-full" onClick={handleReject}>
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 md:w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/invoice/${invoice.id}`)
                }}
              >
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
