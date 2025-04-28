"use client"

import { InvoiceCard } from "@/components/invoice-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useInvoices } from "@/hooks/use-invoices"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useState } from "react"

interface InvoiceListProps {
  initialFilter?: "all" | "pending" | "approved" | "rejected"
  initialSearch?: string
}

export function InvoiceList({ initialFilter = "all", initialSearch = "" }: InvoiceListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(initialFilter)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const { invoices, loading, error } = useInvoices(filter, searchQuery)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-40" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border rounded-lg shadow-sm bg-muted/40">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
        <p className="text-lg font-semibold text-destructive">Error loading invoices</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Input
          placeholder="Search invoice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
          <p className="text-lg font-semibold">No invoices found</p>
          <p className="text-sm text-muted-foreground">
            {filter !== "all"
              ? `No ${filter} invoices found.`
              : searchQuery
              ? "No invoices match your search."
              : "Sync your Gmail to import invoices."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={{
                ...invoice,
                parsedData:
                  typeof invoice.parsedData === "string"
                    ? invoice.parsedData
                    : JSON.stringify(invoice.parsedData),
                description: invoice.description || ""
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}