"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">InvoicePilot</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard">
            <Button variant={pathname === "/dashboard" ? "default" : "ghost"}>Dashboard</Button>
          </Link>
          <Link href="/settings">
            <Button variant={pathname === "/settings" ? "default" : "ghost"}>Settings</Button>
          </Link>
        </nav>
        <div className="ml-4 flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

