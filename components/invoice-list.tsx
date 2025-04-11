"use client"

import { InvoiceCard } from "@/components/invoice-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useInvoices } from "@/hooks/use-invoices"

interface InvoiceListProps {
  filter: "all" | "pending" | "approved" | "rejected"
  searchQuery: string
}

export function InvoiceList({ filter, searchQuery }: InvoiceListProps) {
  const { invoices, loading, error } = useInvoices(filter, searchQuery)

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-destructive">Error loading invoices</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">No invoices found</p>
        <p className="text-muted-foreground">
          {filter !== "all"
            ? `No ${filter} invoices found.`
            : searchQuery
              ? "No invoices match your search."
              : "Sync your Gmail to import invoices."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={{
            ...invoice,
            parsedData:
              typeof invoice.parsedData === "string"
                ? invoice.parsedData
                : { ...invoice.parsedData },
          }}
        />
      ))}
    </div>
  )
}
