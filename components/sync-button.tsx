"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export function SyncButton() {
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const { user } = useAuth()

  const handleSync = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sync emails",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)

    toast({
      title: "Syncing Emails",
      description: "Fetching and processing your invoice emails...",
    })

    try {
      const response = await fetch("/api/sync-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync emails")
      }

      toast({
        title: "Sync Complete",
        description: data.message || "Your invoices have been imported.",
      })
    } catch (error) {
      console.error("Error syncing emails:", error)
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync emails",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isSyncing}>
      {isSyncing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
      Sync Gmail
    </Button>
  )
}

