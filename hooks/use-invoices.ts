"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"

interface Invoice {
  id: string
  vendor: string
  amount: string
  date: string
  status: string
  [key: string]: any
}

export function useInvoices(statusFilter = "all", searchQuery = "") {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const invoiceQuery = collection(db, "users", user.uid, "invoices")
        const queryConstraints = []

        // Add status filter if not 'all'
        if (statusFilter !== "all") {
          queryConstraints.push(where("status", "==", statusFilter))
        }

        // Add order by date
        queryConstraints.push(orderBy("createdAt", "desc"))

        const q = query(invoiceQuery, ...queryConstraints)
        const querySnapshot = await getDocs(q)

        let fetchedInvoices = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[]

        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          fetchedInvoices = fetchedInvoices.filter(
            (invoice) =>
              invoice.vendor?.toLowerCase().includes(query) ||
              invoice.amount?.toLowerCase().includes(query) ||
              invoice.date?.toLowerCase().includes(query),
          )
        }

        setInvoices(fetchedInvoices)
        setError(null)
      } catch (err) {
        console.error("Error fetching invoices:", err)
        setError("Failed to fetch invoices")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [user, statusFilter, searchQuery])

  return { invoices, loading, error }
}

