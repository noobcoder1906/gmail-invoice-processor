"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, Server, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const emailProviderSchema = z.object({
  provider: z.string().min(1, "Please select a provider"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  imapHost: z.string().min(1, "IMAP host is required"),
  imapPort: z.string().min(1, "IMAP port is required"),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
})

type EmailProviderFormValues = z.infer<typeof emailProviderSchema>

const commonProviders = [
  {
    name: "Custom",
    imapHost: "",
    imapPort: "993",
    smtpHost: "",
    smtpPort: "587",
  },
  {
    name: "Yahoo",
    imapHost: "imap.mail.yahoo.com",
    imapPort: "993",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: "587",
  },
  {
    name: "Outlook/Hotmail",
    imapHost: "outlook.office365.com",
    imapPort: "993",
    smtpHost: "smtp.office365.com",
    smtpPort: "587",
  },
  {
    name: "AOL",
    imapHost: "imap.aol.com",
    imapPort: "993",
    smtpHost: "smtp.aol.com",
    smtpPort: "587",
  },
  {
    name: "Zoho",
    imapHost: "imap.zoho.com",
    imapPort: "993",
    smtpHost: "smtp.zoho.com",
    smtpPort: "587",
  },
]

export default function EmailProviderForm({ userId }: { userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<EmailProviderFormValues>({
    resolver: zodResolver(emailProviderSchema),
    defaultValues: {
      provider: "Custom",
      email: "",
      password: "",
      imapHost: "",
      imapPort: "993",
      smtpHost: "",
      smtpPort: "587",
    },
  })

  const onProviderChange = (value: string) => {
    const provider = commonProviders.find((p) => p.name === value)
    if (provider) {
      form.setValue("imapHost", provider.imapHost)
      form.setValue("imapPort", provider.imapPort)
      form.setValue("smtpHost", provider.smtpHost || "")
      form.setValue("smtpPort", provider.smtpPort || "")
    }
  }

  async function onSubmit(data: EmailProviderFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/email/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userId,
          ...data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to connect email account")
      }

      toast({
        title: "Email account connected successfully",
        description: "You can now sync invoices from this account",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Failed to connect email account",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect Email Account</CardTitle>
        <CardDescription>Add your email credentials to sync invoices from non-Google email providers</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Provider</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      onProviderChange(value)
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonProviders.map((provider) => (
                        <SelectItem key={provider.name} value={provider.name}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="your.email@example.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password or App Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" type="password" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    For better security, use an app-specific password if your provider supports it
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imapHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Host</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="imap.example.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imapPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Port</FormLabel>
                    <FormControl>
                      <Input placeholder="993" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtpHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Host (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="smtp.example.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Port (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Connect Email Account
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
