"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoiceList } from "@/components/invoice-list"
import { Navbar } from "@/components/navbar"
import { SyncButton } from "@/components/sync-button"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  className="w-full md:w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <SyncButton />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <InvoiceList filter="all" searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="pending">
              <InvoiceList filter="pending" searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="approved">
              <InvoiceList filter="approved" searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="rejected">
              <InvoiceList filter="rejected" searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
