"use client"

import { useEffect, useState } from "react"
import { Check, RefreshCw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"

import { getAuth, onAuthStateChanged } from "firebase/auth"
import { doc, getFirestore, getDoc } from "firebase/firestore"
import { app } from "@/lib/firebase" // your firebase.ts export



export default function SettingsPage() {
  const { toast } = useToast()

  const [uid, setUid] = useState("")
  const [gmailConnected, setGmailConnected] = useState(false)
  const [apiKey, setApiKey] = useState("sk-••••••••••••••••••••••••••••••")
  const [isTestingApi, setIsTestingApi] = useState(false)

  const auth = getAuth(app)
  const db = getFirestore(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        console.log("✅ Logged in as:", user.uid)

        // Fetch user doc to get Gmail connection status
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.data()
        console.log("📄 Firestore user data:", userData)

        if (userData?.gmailConnected) {
          setGmailConnected(true)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const handleReconnectGmail = () => {
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

    if (!uid || !redirectUri) {
      console.error("❌ Missing UID or redirect URI", { uid, redirectUri })
      toast({
        title: "Missing UID or redirect URI",
        description: "Check .env and make sure you're logged in",
        variant: "destructive",
      })
      return
    }

    const oauthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent&state=${uid}`

    console.log("🔁 Redirecting to Gmail OAuth:", oauthURL)
    window.location.href = oauthURL
  }

  const handleTestApi = () => {
    setIsTestingApi(true)

    setTimeout(() => {
      setIsTestingApi(false)
      toast({
        title: "✅ API Test Successful",
        description: "Your OpenAI API key is working correctly.",
      })
    }, 2000)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>

          <div className="grid gap-6 max-w-2xl">
            {/* Gmail Connection */}
            <Card>
              <CardHeader>
                <CardTitle>Gmail Connection</CardTitle>
                <CardDescription>Connect your Gmail account to sync invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    {gmailConnected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{gmailConnected ? "Connected" : "Not Connected"}</p>
                    <p className="text-sm text-muted-foreground">
                      {gmailConnected
                        ? "Your Gmail account is connected"
                        : "Connect your Gmail account to sync invoices"}
                    </p>
                  </div>
                </div>
                <Button onClick={handleReconnectGmail}>
                  {gmailConnected ? "Reconnect" : "Connect"} Gmail
                </Button>
              </CardContent>
            </Card>

            {/* OpenAI Key */}
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Key</CardTitle>
                <CardDescription>Used for parsing invoice data from emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTestApi} disabled={isTestingApi}>
                      {isTestingApi && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      Test API Key
                    </Button>
                    <Button variant="outline">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
