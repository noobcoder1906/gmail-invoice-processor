"use client"

import { useState } from "react"
import { Mail, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface EmailAccount {
  id: string
  email: string
  provider: string
  imapHost: string
  imapPort: string
  addedAt: string
}

interface EmailAccountsListProps {
  accounts: EmailAccount[]
  userId: string
}

export default function EmailAccountsList({ accounts, userId }: EmailAccountsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteAccount = async (accountId: string) => {
    setIsDeleting(accountId)
    try {
      const response = await fetch("/api/email/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userId,
          accountId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast({
        title: "Email account removed",
        description: "The email account has been removed successfully",
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Failed to remove account",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const testConnection = async (accountId: string) => {
    setIsTesting(accountId)
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userId,
          accountId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Connection test failed")
      }

      toast({
        title: "Connection successful",
        description: "Your email account is connected and working properly",
      })
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      })
    } finally {
      setIsTesting(null)
    }
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Accounts</CardTitle>
          <CardDescription>You haven't connected any email accounts yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 border rounded-md border-dashed">
            <div className="text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Connect an email account to start syncing invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Email Accounts</CardTitle>
        <CardDescription>Manage your connected email accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email Address</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Server</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {account.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{account.provider}</Badge>
                </TableCell>
                <TableCell>
                  {account.imapHost}:{account.imapPort}
                </TableCell>
                <TableCell>{new Date(account.addedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(account.id)}
                      disabled={isTesting === account.id}
                    >
                      {isTesting === account.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          {isDeleting === account.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Email Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this email account? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
