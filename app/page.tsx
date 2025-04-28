"use client"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Automate Your Invoice Processing
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Connect your Gmail, sync invoices, and review them with AI assistance. Designed for accounting teams
                    to streamline invoice approval.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="gap-1.5" onClick={signInWithGoogle}>
                    <Mail className="h-4 w-4" />
                    Login with Gmail
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] bg-muted rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="space-y-4 w-[80%]">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 bg-background rounded-lg shadow-lg transform transition-all duration-500 hover:scale-105"
                          style={{
                            animation: `float ${2 + i * 0.5}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="h-4 w-24 bg-muted-foreground/20 rounded-md mb-2"></div>
                              <div className="h-3 w-16 bg-muted-foreground/20 rounded-md"></div>
                            </div>
                            <div className="h-6 w-16 bg-muted-foreground/20 rounded-md"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}

