// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { useParams, useRouter } from "next/navigation"
// import { ArrowLeft, Calendar, Download, FileText, Mail, User, DollarSign, Clock, CheckCircle, XCircle, Copy, Share2, Eye } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"
// import { formatDistanceToNow, parseISO, format } from "date-fns"
// import { Document, Page } from "react-pdf"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Navbar } from "@/components/navbar"
// import { Separator } from "@/components/ui/separator"
// import { Badge } from "@/components/ui/badge"
// import { useToast } from "@/hooks/use-toast"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Toggle } from "@/components/ui/toggle"

// import { doc, getDoc, updateDoc } from "firebase/firestore"
// import { db } from "@/lib/firebase"
// import { getAuth, onAuthStateChanged } from "firebase/auth"

// const fadeIn = {
//   initial: { opacity: 0, y: 10 },
//   animate: { opacity: 1, y: 0 },
//   exit: { opacity: 0, y: -10 },
//   transition: { duration: 0.4 }
// }

// const itemAnimation = {
//   initial: { opacity: 0, y: 20 },
//   animate: { opacity: 1, y: 0 },
//   transition: { duration: 0.5 }
// }

// export default function InvoiceDetailPage() {
//   const { id } = useParams<{ id: string }>()
//   const router = useRouter()
//   const { toast } = useToast()

//   const [invoice, setInvoice] = useState<any | null>(null)
//   const [status, setStatus] = useState("pending")
//   const [loading, setLoading] = useState(true)
//   const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
//   const [activeSection, setActiveSection] = useState(null)
//   const [viewMode, setViewMode] = useState("detailed")
//   const [showPdfPreview, setShowPdfPreview] = useState(false)
//   const [pdfLoaded, setPdfLoaded] = useState(false)

//   useEffect(() => {
//     const auth = getAuth()

//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!user || !id) {
//         console.error("❌ UID or ID missing", { uid: user?.uid, id })
//         setLoading(false)
//         return
//       }

//       const uid = user.uid
//       try {
//         const docRef = doc(db, "users", uid, "invoices", id)
//         const docSnap = await getDoc(docRef)

//         if (docSnap.exists()) {
//           const data = docSnap.data()
//           let parsed = data.parsedData
//           if (typeof parsed === "string") {
//             try {
//               parsed = JSON.parse(parsed)
//             } catch (e) {
//               parsed = {}
//             }
//           }
//           setInvoice({ ...data, parsed })
//           setStatus(data.status)
//         } else {
//           console.warn("⚠️ Invoice not found in Firestore")
//         }
//       } catch (err) {
//         console.error("❌ Error fetching invoice:", err)
//       } finally {
//         setLoading(false)
//       }
//     })

//     return () => unsubscribe()
//   }, [id])

//   const handleApprove = async () => {
//     if (!invoice || !id) return

//     setStatus("approved")
//     setShowSuccessAnimation(true)
    
//     setTimeout(() => {
//       setShowSuccessAnimation(false)
//     }, 2000)
    
//     toast({ 
//       title: "Invoice Approved", 
//       description: "The invoice has been marked as approved.",
//       variant: "success" 
//     })
    
//     try {
//       const auth = getAuth()
//       const user = auth.currentUser
//       if (!user) return
      
//       const docRef = doc(db, "users", user.uid, "invoices", id)
//       await updateDoc(docRef, { status: "approved" })
//     } catch (err) {
//       console.error("Error updating status:", err)
//       toast({
//         title: "Update Failed",
//         description: "Failed to update status in database",
//         variant: "destructive"
//       })
//     }
//   }

//   const handleReject = async () => {
//     if (!invoice || !id) return
    
//     setStatus("rejected")
//     toast({ 
//       title: "Invoice Rejected", 
//       description: "The invoice has been marked as rejected.",
//       variant: "destructive" 
//     })
    
//     try {
//       const auth = getAuth()
//       const user = auth.currentUser
//       if (!user) return
      
//       const docRef = doc(db, "users", user.uid, "invoices", id)
//       await updateDoc(docRef, { status: "rejected" })
//     } catch (err) {
//       console.error("Error updating status:", err)
//       toast({
//         title: "Update Failed",
//         description: "Failed to update status in database",
//         variant: "destructive"
//       })
//     }
//   }

//   const handleDownload = () => {
//     if (!invoice?.attachment) return
//     const link = document.createElement("a")
//     link.href = `data:application/pdf;base64,${invoice.attachment}`
//     link.download = "invoice.pdf"
//     link.click()
//   }

//   const handleCopy = (text) => {
//     navigator.clipboard.writeText(text)
//     toast({
//       title: "Copied to clipboard",
//       description: "The invoice information has been copied",
//       variant: "success"
//     })
//   }

//   const handleShare = () => {
//     if (navigator.share) {
//       navigator.share({
//         title: `Invoice #${parsed?.invoice_number || id}`,
//         text: `Invoice from ${parsed?.vendor || "Unknown"} for ${formatCurrency(parsed?.total_amount)}`,
//         url: window.location.href,
//       })
//     } else {
//       toast({
//         title: "Share not supported",
//         description: "Your browser doesn't support share functionality",
//         variant: "destructive"
//       })
//     }
//   }

//   const getBadgeColor = (status) => {
//     switch (status) {
//       case "approved": return "bg-green-100 text-green-800 border-green-200"
//       case "rejected": return "bg-red-100 text-red-800 border-red-200"
//       default: return "bg-amber-100 text-amber-800 border-amber-200"
//     }
//   }

//   const getConfidenceScore = () => {
//     if (!invoice?.parsed) return 0
    
//     // Calculate a mock confidence score based on how many fields were successfully parsed
//     const expectedFields = ['vendor', 'invoice_number', 'total_amount', 'invoice_date', 'due_date', 'gstin']
//     const foundFields = expectedFields.filter(field => invoice.parsed[field])
//     return Math.round((foundFields.length / expectedFields.length) * 100)
//   }

//   const formatDateFriendly = (dateStr) => {
//     if (!dateStr) return "-"
//     try {
//       return format(parseISO(dateStr), 'MMMM d, yyyy')
//     } catch (e) {
//       return dateStr
//     }
//   }

//   const getDueInText = (dateStr) => {
//     if (!dateStr) return "-"
//     try {
//       const date = parseISO(dateStr)
//       const now = new Date()
//       if (date < now) {
//         return `Overdue by ${formatDistanceToNow(date)}`
//       }
//       return `Due in ${formatDistanceToNow(date)}`
//     } catch (e) {
//       return dateStr
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-screen flex-col">
//         <Navbar />
//         <main className="flex-1 bg-white">
//           <div className="container mx-auto py-6 px-4 md:px-6">
//             <div className="flex items-center gap-4 mb-6">
//               <Button variant="outline" size="icon" disabled>
//                 <ArrowLeft className="h-4 w-4" />
//               </Button>
//               <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
//             </div>
            
//             <div className="w-full h-36 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 mb-8">
//               <div className="p-6">
//                 <Skeleton className="h-8 w-48 mb-4" />
//                 <div className="flex justify-between">
//                   <Skeleton className="h-6 w-32" />
//                   <Skeleton className="h-6 w-24" />
//                 </div>
//               </div>
//             </div>
            
//             <div className="grid gap-6 md:grid-cols-2">
//               <div className="space-y-6">
//                 <Card>
//                   <CardContent className="p-6">
//                     <Skeleton className="h-6 w-40 mb-4" />
//                     <div className="space-y-4">
//                       <Skeleton className="h-4 w-full" />
//                       <Skeleton className="h-4 w-3/4" />
//                       <Skeleton className="h-4 w-5/6" />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//               <div className="space-y-6">
//                 <Card>
//                   <CardContent className="p-6">
//                     <Skeleton className="h-6 w-40 mb-4" />
//                     <div className="space-y-4">
//                       <Skeleton className="h-4 w-full" />
//                       <Skeleton className="h-4 w-3/4" />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     )
//   }

//   if (!invoice) {
//     return (
//       <div className="flex min-h-screen flex-col">
//         <Navbar />
//         <main className="flex-1 bg-white">
//           <div className="container mx-auto py-6 px-4 md:px-6">
//             <div className="flex items-center gap-4 mb-6">
//               <Link href="/dashboard">
//                 <Button variant="outline" size="icon">
//                   <ArrowLeft className="h-4 w-4" />
//                 </Button>
//               </Link>
//               <h1 className="text-2xl font-bold tracking-tight">Invoice Details</h1>
//             </div>
            
//             <Card className="w-full p-12 flex flex-col items-center justify-center text-center">
//               <div className="rounded-full bg-red-100 p-3 mb-4">
//                 <FileText className="h-6 w-6 text-red-500" />
//               </div>
//               <h3 className="text-xl font-semibold mb-2">Invoice Not Found</h3>
//               <p className="text-gray-600 mb-6">The requested invoice could not be found in our system.</p>
//               <Button onClick={() => router.push("/dashboard")}>
//                 Return to Dashboard
//               </Button>
//             </Card>
//           </div>
//         </main>
//       </div>
//     )
//   }

//   const parsed = invoice.parsed || {}

//   const formatCurrency = (amount) => {
//     if (!amount) return "-"
//     // Simple currency formatting
//     if (typeof amount === 'string' && amount.startsWith('₹')) {
//       return amount
//     }
//     return typeof amount === 'number' 
//       ? `₹${amount.toLocaleString('en-IN')}`
//       : `₹${amount}`;
//   }

//   return (
//     <div className="flex min-h-screen flex-col">
//       <Navbar />
//       <main className="flex-1 bg-gray-50">
//         <div className="container mx-auto py-6 px-4 md:px-6">
//           <div className="flex items-center gap-4 mb-6">
//             <Link href="/dashboard">
//               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                 <Button variant="outline" size="icon" className="shadow-sm">
//                   <ArrowLeft className="h-4 w-4" />
//                 </Button>
//               </motion.div>
//             </Link>
//             <motion.h1 
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               className="text-2xl font-bold tracking-tight text-gray-800"
//             >
//               Invoice Details
//             </motion.h1>
            
//             <div className="ml-auto flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="hidden md:flex items-center gap-1"
//                 onClick={() => setViewMode(viewMode === "detailed" ? "summary" : "detailed")}
//               >
//                 {viewMode === "detailed" ? "Summary View" : "Detailed View"}
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="hidden md:flex items-center gap-1"
//                 onClick={handleShare}
//               >
//                 <Share2 className="h-4 w-4" />
//                 Share
//               </Button>
//             </div>
//           </div>

//           <AnimatePresence>
//             {showSuccessAnimation && (
//               <motion.div 
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30"
//               >
//                 <div className="bg-white rounded-full p-8 shadow-xl">
//                   <CheckCircle className="h-16 w-16 text-green-500" />
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//             className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 mb-8 shadow-md"
//           >
//             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
//               <div>
//                 {parsed.logo_url && (
//                   <img src={parsed.logo_url} alt="Vendor Logo" className="h-10 w-auto mb-2 rounded shadow-sm bg-white p-1" />
//                 )}
//                 <h2 className="text-2xl font-bold text-white">{parsed.vendor || "Unknown Vendor"}</h2>
//                 <div className="flex items-center gap-2">
//                   <p className="text-blue-100">Invoice #{parsed.invoice_number || id}</p>
//                   <Button 
//                     variant="ghost" 
//                     size="icon" 
//                     className="h-6 w-6 text-blue-100 hover:text-white hover:bg-blue-500/20"
//                     onClick={() => handleCopy(`Invoice #${parsed.invoice_number || id} from ${parsed.vendor || "Unknown"}`)}
//                   >
//                     <Copy className="h-3 w-3" />
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex flex-col md:flex-row gap-4 md:items-center">
//                 <Badge 
//                   className={`capitalize text-sm px-3 py-1 font-medium ${getBadgeColor(status)}`}
//                 >
//                   {status}
//                 </Badge>
//                 <div className="flex flex-col">
//                   <p className="text-sm text-blue-100">Total Amount</p>
//                   <div className="flex items-center gap-2">
//                     <p className="text-2xl font-bold text-white bg-blue-500/20 px-3 py-1 rounded-md">
//                       {formatCurrency(parsed.total_amount)}
//                     </p>
//                     <Button 
//                       variant="ghost" 
//                       size="icon" 
//                       className="h-6 w-6 text-blue-100 hover:text-white hover:bg-blue-500/20"
//                       onClick={() => handleCopy(formatCurrency(parsed.total_amount))}
//                     >
//                       <Copy className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//           <div className="grid gap-6 md:grid-cols-2">
//             <motion.div 
//               className="space-y-6"
//               initial="initial"
//               animate="animate"
//               variants={{
//                 initial: { opacity: 0 },
//                 animate: { opacity: 1, transition: { staggerChildren: 0.15 } }
//               }}
//             >
//               <motion.div 
//                 variants={itemAnimation}
//                 whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                 onMouseEnter={() => setActiveSection('details')}
//               >
//                 <Card className="overflow-hidden transition-all border-gray-200">
//                   <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                     <div className="flex items-center gap-2">
//                       <DollarSign className="h-4 w-4 text-blue-600" />
//                       <h3 className="font-semibold text-gray-800">Invoice Details</h3>
//                     </div>
//                   </div>
//                   <CardContent className="p-6">
//                     <div className="grid gap-y-4 gap-x-6 md:grid-cols-2">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Amount</p>
//                         <p className="text-xl font-bold text-gray-800 bg-green-50 p-2 rounded border-l-4 border-green-400 mt-1">
//                           {formatCurrency(parsed.total_amount)}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Vendor</p>
//                         <p className="font-medium text-gray-700 mt-1">{parsed.vendor || "-"}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Invoice Date</p>
//                         <div className="flex items-center gap-1 text-gray-700 mt-1">
//                           <Calendar className="h-3 w-3 text-blue-500" />
//                           <p>{formatDateFriendly(parsed.invoice_date) || "-"}</p>
//                         </div>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Due Date</p>
//                         <div className="flex items-center gap-1 text-gray-700 mt-1">
//                           <Calendar className="h-3 w-3 text-blue-500" />
//                           <p className={parsed.due_date && new Date(parsed.due_date) < new Date() ? "text-red-600 font-medium" : ""}>
//                             {getDueInText(parsed.due_date) || "-"}
//                           </p>
//                         </div>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">GSTIN</p>
//                         <p className="text-gray-700 mt-1">{parsed.gstin || "-"}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Invoice #</p>
//                         <p className="text-gray-700 mt-1">{parsed.invoice_number || id}</p>
//                       </div>
//                     </div>
                    
//                     <div className="mt-4">
//                       <p className="text-sm font-medium text-gray-500">AI Confidence</p>
//                       <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//                         <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getConfidenceScore()}%` }}></div>
//                       </div>
//                       <p className="text-xs text-gray-500 mt-1">Confidence: {getConfidenceScore()}%</p>
//                     </div>
                    
//                     {parsed.description && (
//                       <>
//                         <Separator className="my-4" />
//                         <div>
//                           <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
//                           <p className="text-sm text-gray-700">{parsed.description}</p>
                          
//                           <div className="mt-3 flex flex-wrap gap-2">
//                             {parsed.description.split(" ")
//                               .filter(word => word.length > 3)
//                               .slice(0, 5)
//                               .map((word, idx) => (
//                                 <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
//                                   {word}
//                                 </Badge>
//                               ))}
//                           </div>
//                         </div>
//                       </>
//                     )}
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               <motion.div 
//                 variants={itemAnimation}
//                 whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                 onMouseEnter={() => setActiveSection('email')}
//               >
//                 <Card className="overflow-hidden transition-all border-gray-200">
//                   <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                     <div className="flex items-center gap-2">
//                       <Mail className="h-4 w-4 text-blue-600" />
//                       <h3 className="font-semibold text-gray-800">Email Information</h3>
//                     </div>
//                   </div>
//                   <CardContent className="p-6">
//                     <div className="space-y-4">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">From</p>
//                         <div className="flex items-center gap-2 mt-1 text-gray-700">
//                           <User className="h-3 w-3 text-blue-500" />
//                           <p>{invoice.from || "-"}</p>
//                         </div>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Subject</p>
//                         <p className="mt-1 text-gray-700">{invoice.subject || "-"}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Received</p>
//                         <div className="flex items-center gap-2 mt-1 text-gray-700">
//                           <Clock className="h-3 w-3 text-blue-500" />
//                           <p>{formatDateFriendly(invoice.date) || "-"}</p>
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               <motion.div 
//                 variants={itemAnimation}
//                 whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                 onMouseEnter={() => setActiveSection('attachments')}
//               >
//                 <Card className="overflow-hidden transition-all border-gray-200">
//                   <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                     <div className="flex items-center gap-2">
//                       <FileText className="h-4 w-4 text-blue-600" />
//                       <h3 className="font-semibold text-gray-800">Attachments</h3>
//                     </div>
//                   </div>
//                   <CardContent className="p-6">
//                     {invoice.attachment ? (
//                       <div className="space-y-4">
//                         <div className="border rounded-lg p-4 flex items-center gap-3 transition-all hover:bg-slate-50">
//                           <div className="bg-blue-100 rounded-lg p-2">
//                             <FileText className="h-5 w-5 text-blue-600" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="font-medium truncate text-gray-800">invoice.pdf</p>
//                             <p className="text-xs text-gray-500">PDF Attachment</p>
//                           </div>
//                           <div className="flex gap-2">
//                             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                               <Button 
//                                 size="sm" 
//                                 variant="outline"
//                                 className="transition-all shadow-sm border-blue-200 text-blue-600 hover:bg-blue-50"
//                                 onClick={() => setShowPdfPreview(!showPdfPreview)}
//                               >
//                                 <Eye className="h-4 w-4 mr-1" />
//                                 {showPdfPreview ? "Hide" : "Preview"}
//                               </Button>
//                             </motion.div>
//                             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                               <Button 
//                                 size="sm" 
//                                 className="transition-all shadow-sm bg-blue-600 hover:bg-blue-700" 
//                                 onClick={handleDownload}
//                               >
//                                 <Download className="h-4 w-4 mr-1" />
//                                 Download
//                               </Button>
//                             </motion.div>
//                           </div>
//                         </div>
                        
//                         {showPdfPreview && (
//                           <div className="border rounded-lg p-4 bg-gray-50 min-h-64 flex justify-center">
//                             <div className="w-full max-w-md">
//                               {!pdfLoaded && <p className="text-center py-16 text-gray-500">Loading PDF preview...</p>}
//                               <Document 
//                                 file={`data:application/pdf;base64,${invoice.attachment}`}
//                                 onLoadSuccess={() => setPdfLoaded(true)}
//                               >
//                                 <Page pageNumber={1} width={400} />
//                               </Document>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       <p className="text-gray-500 text-center py-4">No attachments found</p>
//                     )}
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </motion.div>

//             <motion.div 
//               className="space-y-6"
//               initial="initial"
//               animate="animate"
//               variants={{
//                 initial: { opacity: 0 },
//                 animate: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
//               }}
//             >
//               <motion.div 
//                 variants={itemAnimation}
//                 whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                 onMouseEnter={() => setActiveSection('actions')}
//               >
//                 <Card className="overflow-hidden transition-all border-gray-200">
//                   <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                     <h3 className="font-semibold text-gray-800">Actions</h3>
//                   </div>
//                   <CardContent className="p-6">
//                     <div className="space-y-3">
//                       <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                         <Button 
//                           className="w-full transition-all shadow-md bg-green-600 hover:bg-green-700" 
//                           onClick={handleApprove} 
//                           disabled={status === "approved"}
//                         >
//                           {status === "approved" ? (
//                             <div className="flex items-center">
//                               <CheckCircle className="h-4 w-4 mr-2" />
//                               Approved
//                             </div>
//                           ) : "Approve Invoice"}
//                         </Button>
//                       </motion.div>
//                       <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                         <Button
//                           variant="outline"
//                           className="w-full transition-all shadow-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
//                           onClick={handleReject}
//                           disabled={status === "rejected"}
//                         >
//                           {status === "rejected" ? (
//                             <div className="flex items-center">
//                               <XCircle className="h-4 w-4 mr-2" />
//                               Rejected
//                             </div>
//                           ) : "Reject Invoice"}
//                         </Button>
//                       </motion.div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               <motion.div 
//                 variants={itemAnimation}
//                 whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                 onMouseEnter={() => setActiveSection('timeline')}
//               >
//                 <Card className="overflow-hidden transition-all border-gray-200">
//                   <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                     <div className="flex items-center gap-2">
//                       <Clock className="h-4 w-4 text-blue-600" />
//                       <h3 className="font-semibold text-gray-800">Timeline</h3>
//                     </div>
//                   </div>
//                   <CardContent className="p-6">
//                   <Accordion type="single" collapsible className="w-full">
//                       <AccordionItem value="item-1" className="border-none">
//                         <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
//                           <motion.div 
//                             className="relative"
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ duration: 0.5, delay: 0.3 }}
//                           >
//                             <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500 border-4 border-blue-100"></div>
//                             <div>
//                               <p className="font-medium text-gray-800">Email Synced</p>
//                               <p className="text-sm text-gray-500">{formatDateFriendly(invoice.date) || "Unknown date"}</p>
//                               <AccordionTrigger className="py-1">
//                                 <span className="text-xs text-blue-600">View details</span>
//                               </AccordionTrigger>
//                               <AccordionContent>
//                                 <div className="bg-blue-50 rounded p-3 text-sm">
//                                   <p className="text-gray-600">Source: Email Connector</p>
//                                   <p className="text-gray-600">Thread ID: {invoice.threadId?.substring(0, 8) || "Unknown"}</p>
//                                 </div>
//                               </AccordionContent>
//                             </div>
//                           </motion.div>
//                           <motion.div 
//                             className="relative"
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ duration: 0.5, delay: 0.5 }}
//                           >
//                             <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500 border-4 border-blue-100"></div>
//                             <div>
//                               <p className="font-medium text-gray-800">Invoice Parsed by AI</p>
//                               <p className="text-sm text-gray-500">{formatDateFriendly(invoice.createdAt) || "Unknown date"}</p>
//                               <AccordionTrigger className="py-1">
//                                 <span className="text-xs text-blue-600">View details</span>
//                               </AccordionTrigger>
//                               <AccordionContent>
//                                 <div className="bg-blue-50 rounded p-3 text-sm">
//                                   <p className="text-gray-600">Fields extracted: {Object.keys(parsed).length}</p>
//                                   <p className="text-gray-600">Confidence: {getConfidenceScore()}%</p>
//                                 </div>
//                               </AccordionContent>
//                             </div>
//                           </motion.div>
//                           {status !== "pending" && (
//                             <motion.div 
//                               className="relative"
//                               initial={{ opacity: 0, x: -20 }}
//                               animate={{ opacity: 1, x: 0 }}
//                               transition={{ duration: 0.5, delay: 0.7 }}
//                             >
//                               <div className={`absolute -left-6 mt-1 w-3 h-3 rounded-full ${status === "approved" ? "bg-green-500 border-green-100" : "bg-red-500 border-red-100"} border-4`}></div>
//                               <div>
//                                 <p className="font-medium text-gray-800">Invoice {status === "approved" ? "Approved" : "Rejected"}</p>
//                                 <p className="text-sm text-gray-500">Just now</p>
//                                 <AccordionTrigger className="py-1">
//                                   <span className="text-xs text-blue-600">View details</span>
//                                 </AccordionTrigger>
//                                 <AccordionContent>
//                                   <div className="bg-blue-50 rounded p-3 text-sm">
//                                     <p className="text-gray-600">By: Current User</p>
//                                     <p className="text-gray-600">Status: {status}</p>
//                                   </div>
//                                 </AccordionContent>
//                               </div>
//                             </motion.div>
//                           )}
//                         </div>
//                       </AccordionItem>
//                     </Accordion>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {Object.keys(parsed).length > 0 && (
//                 <motion.div 
//                   variants={itemAnimation}
//                   whileHover={{ y: -5, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transition: { duration: 0.2 } }}
//                   onMouseEnter={() => setActiveSection('additional')}
//                 >
//                   <Card className="overflow-hidden transition-all border-gray-200">
//                     <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
//                       <h3 className="font-semibold text-gray-800">Additional Fields</h3>
//                     </div>
//                     <CardContent className="p-6">
//                       <div className="grid gap-3">
//                         {Object.entries(parsed)
//                           .filter(([key]) => !['vendor', 'invoice_number', 'total_amount', 'invoice_date', 'due_date', 'gstin', 'description', 'logo_url'].includes(key))
//                           .map(([key, value], index) => (
//                             <motion.div 
//                               key={key} 
//                               className="flex justify-between border-b pb-2 last:border-0"
//                               initial={{ opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ delay: index * 0.1 }}
//                             >
//                               <p className="text-sm font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</p>
//                               <p className="text-sm text-gray-600">{value?.toString() || "-"}</p>
//                             </motion.div>
//                           ))}
//                         {Object.entries(parsed)
//                           .filter(([key]) => !['vendor', 'invoice_number', 'total_amount', 'invoice_date', 'due_date', 'gstin', 'description', 'logo_url'].includes(key)).length === 0 && (
//                             <p className="text-gray-500 text-center py-4">No additional fields</p>
//                           )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               )}
//             </motion.div>
//           </div>

//           {/* Mobile Actions Footer - Visible only on mobile devices */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.8 }}
//             className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-4 z-10"
//           >
//             <div className="grid grid-cols-3 gap-2">
//               <Button
//                 variant="outline"
//                 className="text-xs"
//                 onClick={() => setViewMode(viewMode === "detailed" ? "summary" : "detailed")}
//               >
//                 {viewMode === "detailed" ? "Summary" : "Detailed"}
//               </Button>
//               <Button
//                 variant={status === "approved" ? "outline" : "default"} 
//                 className={status === "approved" ? "text-green-600 border-green-200 bg-green-50 text-xs" : "bg-green-600 hover:bg-green-700 text-xs"}
//                 onClick={handleApprove}
//                 disabled={status === "approved"}
//               >
//                 {status === "approved" ? (
//                   <div className="flex items-center">
//                     <CheckCircle className="h-3 w-3 mr-1" />
//                     Approved
//                   </div>
//                 ) : "Approve"}
//               </Button>
//               <Button
//                 variant={status === "rejected" ? "outline" : "outline"}
//                 className={status === "rejected" ? "text-red-600 border-red-200 bg-red-50 text-xs" : "border-red-200 text-red-600 hover:bg-red-50 text-xs"}
//                 onClick={handleReject}
//                 disabled={status === "rejected"}
//               >
//                 {status === "rejected" ? (
//                   <div className="flex items-center">
//                     <XCircle className="h-3 w-3 mr-1" />
//                     Rejected
//                   </div>
//                 ) : "Reject"}
//               </Button>
//             </div>
//           </motion.div>
//         </div>
//       </main>
//     </div>
//   )
// }
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Mail,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4 },
}

const itemAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<any | null>(null)
  const [status, setStatus] = useState("pending")
  const [loading, setLoading] = useState(true)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [pdfScale, setPdfScale] = useState(1)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !id) {
        console.error("❌ UID or ID missing", { uid: user?.uid, id })
        setLoading(false)
        return
      }

      const uid = user.uid
      try {
        const docRef = doc(db, "users", uid, "invoices", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          let parsed = data.parsedData
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed)
            } catch (e) {
              parsed = {}
            }
          }
          setInvoice({ ...data, parsed })
          setStatus(data.status || "pending")
        } else {
          console.warn("⚠️ Invoice not found in Firestore")
        }
      } catch (err) {
        console.error("❌ Error fetching invoice:", err)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [id])

  const handleApprove = async () => {
    if (!invoice || !id) return

    setStatus("approved")
    setShowSuccessAnimation(true)

    setTimeout(() => {
      setShowSuccessAnimation(false)
    }, 2000)

    toast({
      title: "Invoice Approved",
      description: "The invoice has been marked as approved.",
      variant: "success",
    })

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return

      const docRef = doc(db, "users", user.uid, "invoices", id)
      await updateDoc(docRef, { status: "approved" })
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Update Failed",
        description: "Failed to update status in database",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!invoice || !id) return

    setStatus("rejected")
    toast({
      title: "Invoice Rejected",
      description: "The invoice has been marked as rejected.",
      variant: "destructive",
    })

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return

      const docRef = doc(db, "users", user.uid, "invoices", id)
      await updateDoc(docRef, { status: "rejected" })
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Update Failed",
        description: "Failed to update status in database",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (!invoice?.attachment) return
    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${invoice.attachment}`
    link.download = "invoice.pdf"
    link.click()
  }

  const getBadgeColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return "-"
    // Simple currency formatting
    if (typeof amount === "string" && amount.startsWith("₹")) {
      return amount
    }
    return typeof amount === "number" ? `₹${amount.toLocaleString("en-IN")}` : `₹${amount}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-yellow -100">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto py-6 px-4 md:px-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" disabled>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-yellow -800">Invoice Details</h1>
            </div>

            <div className="w-full h-36 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 mb-8">
              <div className="p-6">
                <Skeleton className="h-8 w-48 mb-4 bg-blue-400/30" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32 bg-blue-400/30" />
                  <Skeleton className="h-6 w-24 bg-blue-400/30" />
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <Skeleton className="h-6 w-40 bg-blue-200" />
                  </div>
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <Skeleton className="h-6 w-40 bg-blue-200" />
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <Skeleton className="h-6 w-40 bg-blue-200" />
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <Skeleton className="h-6 w-40 bg-blue-200" />
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen flex-col bg-yellow -100">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto py-6 px-4 md:px-6">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-yellow -800">Invoice Details</h1>
            </div>

            <Card className="w-full p-12 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-yellow -800">Invoice Not Found</h3>
              <p className="text-yellow -600 mb-6">The requested invoice could not be found in our system.</p>
              <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const parsed = invoice.parsed || {}

  return (
    <div className="flex min-h-screen flex-col bg-yellow -100">
      <header className="sticky top-0 z-10 bg-yellow  border-b border-yellow -200 shadow-sm">
        <div className="container mx-auto py-4 px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="shadow-sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-yellow -800">Invoice Details</h1>
                <div className="flex items-center text-sm text-yellow -600">
                  <Link href="/dashboard" className="hover:text-yellow -800">
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <Link href="/invoices" className="hover:text-yellow -800">
                    Invoices
                  </Link>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="text-yellow -800">#{parsed.invoice_number || id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="hidden md:flex"
                disabled={!invoice.attachment}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={status === "approved"}
                className={`hidden md:flex ${status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {status === "approved" ? (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approved
                  </div>
                ) : (
                  "Approve"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={status === "rejected"}
                className={`hidden md:flex ${status === "rejected" ? "border-red-200 text-red-600" : "border-yellow -200 text-yellow -700"}`}
              >
                {status === "rejected" ? (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejected
                  </div>
                ) : (
                  "Reject"
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30"
          >
            <div className="bg-yellow  rounded-full p-8 shadow-xl">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 mb-8 shadow-md"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-yellow ">{parsed.vendor || "Unknown Vendor"}</h2>
                <p className="text-blue-100">Invoice #{parsed.invoice_number || id}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <Badge className={`capitalize text-sm px-3 py-1 font-medium ${getBadgeColor(status)}`}>{status}</Badge>
                <div className="flex flex-col items-end">
                  {parsed.total_amount_inr && (
                    <p className="text-xl md:text-2xl font-bold text-yellow ">₹{parsed.total_amount_inr}</p>
                  )}
                  {parsed.total_amount_usd && <p className="text-sm text-blue-100">${parsed.total_amount_usd} USD</p>}
                  {!parsed.total_amount_inr && !parsed.total_amount_usd && parsed.total_amount && (
                    <p className="text-xl md:text-2xl font-bold text-yellow ">{formatCurrency(parsed.total_amount)}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-6 md:grid-cols-3">
                <motion.div
                  className="md:col-span-2 space-y-6"
                  initial="initial"
                  animate="animate"
                  variants={{
                    initial: { opacity: 0 },
                    animate: { opacity: 1, transition: { staggerChildren: 0.15 } },
                  }}
                >
                  <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-yellow -800">Invoice Details</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid gap-y-4 gap-x-6 md:grid-cols-2">
                          {parsed.total_amount_inr && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Amount (INR)</p>
                              <p className="text-lg font-bold text-yellow -800">₹{parsed.total_amount_inr}</p>
                            </div>
                          )}
                          {parsed.total_amount_usd && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Amount (USD)</p>
                              <p className="text-lg font-bold text-yellow -800">${parsed.total_amount_usd}</p>
                            </div>
                          )}
                          {!parsed.total_amount_inr && !parsed.total_amount_usd && parsed.total_amount && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Amount</p>
                              <p className="text-lg font-bold text-yellow -800">{formatCurrency(parsed.total_amount)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-yellow -600">Invoice Date</p>
                            <div className="flex items-center gap-1 text-yellow -800">
                              <Calendar className="h-3 w-3 text-blue-500" />
                              <p>{parsed.invoice_date || "-"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow -600">Invoice #</p>
                            <p className="text-yellow -800">{parsed.invoice_number || id}</p>
                          </div>
                          {parsed.gst && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">GST</p>
                              <p className="text-yellow -800">₹{parsed.gst}</p>
                            </div>
                          )}
                          {parsed.mode_of_payment && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Payment Mode</p>
                              <p className="text-yellow -800">{parsed.mode_of_payment}</p>
                            </div>
                          )}
                        </div>

                        {parsed.description && (
                          <>
                            <Separator className="my-4" />
                            <div>
                              <p className="text-sm font-medium text-yellow -600 mb-2">Description</p>
                              <p className="text-sm text-yellow -800">{parsed.description}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-yellow -800">Vendor Information</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-yellow -600">Vendor Name</p>
                            <p className="font-medium text-yellow -800">{parsed.vendor || "-"}</p>
                          </div>
                          {parsed.vendor_address && (
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Vendor Address</p>
                              <p className="text-yellow -800 yellow space-pre-line">{parsed.vendor_address}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {parsed.vendor_gstin && (
                              <div>
                                <p className="text-sm font-medium text-yellow -600">GSTIN</p>
                                <p className="text-yellow -800">{parsed.vendor_gstin}</p>
                              </div>
                            )}
                            {parsed.vendor_pan && (
                              <div>
                                <p className="text-sm font-medium text-yellow -600">PAN</p>
                                <p className="text-yellow -800">{parsed.vendor_pan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {parsed.client_name && (
                    <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                      <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                        <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <h3 className="font-semibold text-yellow -800">Client Information</h3>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-yellow -600">Client Name</p>
                              <p className="font-medium text-yellow -800">{parsed.client_name}</p>
                            </div>
                            {parsed.client_address && (
                              <div>
                                <p className="text-sm font-medium text-yellow -600">Client Address</p>
                                <p className="text-yellow -800 yellow space-pre-line">{parsed.client_address}</p>
                              </div>
                            )}
                            {parsed.client_gstin && (
                              <div>
                                <p className="text-sm font-medium text-yellow -600">GSTIN</p>
                                <p className="text-yellow -800">{parsed.client_gstin}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-yellow -800">Email Information</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-yellow -600">From</p>
                            <div className="flex items-center gap-2 mt-1 text-yellow -800">
                              <User className="h-3 w-3 text-blue-500" />
                              <p>{invoice.from || "-"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow -600">Subject</p>
                            <p className="mt-1 text-yellow -800">{invoice.subject || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow -600">Received</p>
                            <div className="flex items-center gap-2 mt-1 text-yellow -800">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <p>{invoice.date || "-"}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="space-y-6"
                  initial="initial"
                  animate="animate"
                  variants={{
                    initial: { opacity: 0 },
                    animate: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
                  }}
                >
                  <motion.div
                    variants={itemAnimation}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="md:sticky md:top-24"
                  >
                    <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                        <h3 className="font-semibold text-yellow -800">Actions</h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {invoice.attachment && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                className="w-full transition-all shadow-md bg-blue-600 hover:bg-blue-700"
                                onClick={handleDownload}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </Button>
                            </motion.div>
                          )}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              className="w-full transition-all shadow-md bg-green-600 hover:bg-green-700"
                              onClick={handleApprove}
                              disabled={status === "approved"}
                            >
                              {status === "approved" ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approved
                                </div>
                              ) : (
                                "Approve Invoice"
                              )}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              className="w-full transition-all shadow-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={handleReject}
                              disabled={status === "rejected"}
                            >
                              {status === "rejected" ? (
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejected
                                </div>
                              ) : (
                                "Reject Invoice"
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-yellow -800">Timeline</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
                          <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                          >
                            <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500 border-4 border-blue-100"></div>
                            <div>
                              <p className="font-medium text-yellow -800">Email Synced</p>
                              <p className="text-sm text-yellow -600">{invoice.date || "Unknown date"}</p>
                            </div>
                          </motion.div>
                          <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                          >
                            <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500 border-4 border-blue-100"></div>
                            <div>
                              <p className="font-medium text-yellow -800">Invoice Parsed by AI</p>
                              <p className="text-sm text-yellow -600">{invoice.createdAt || "Unknown date"}</p>
                            </div>
                          </motion.div>
                          {status !== "pending" && (
                            <motion.div
                              className="relative"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 0.7 }}
                            >
                              <div
                                className={`absolute -left-6 mt-1 w-3 h-3 rounded-full ${status === "approved" ? "bg-green-500 border-green-100" : "bg-red-500 border-red-100"} border-4`}
                              ></div>
                              <div>
                                <p className="font-medium text-yellow -800">
                                  Invoice {status === "approved" ? "Approved" : "Rejected"}
                                </p>
                                <p className="text-sm text-yellow -600">Just now</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {Object.keys(parsed).length > 0 && (
                    <motion.div variants={itemAnimation} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                      <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                        <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                          <h3 className="font-semibold text-yellow -800">Additional Fields</h3>
                        </div>
                        <CardContent className="p-6">
                          <div className="grid gap-3">
                            {Object.entries(parsed)
                              .filter(
                                ([key]) =>
                                  ![
                                    "vendor",
                                    "invoice_number",
                                    "total_amount",
                                    "total_amount_inr",
                                    "total_amount_usd",
                                    "invoice_date",
                                    "due_date",
                                    "gstin",
                                    "description",
                                    "vendor_address",
                                    "vendor_gstin",
                                    "vendor_pan",
                                    "client_name",
                                    "client_address",
                                    "client_gstin",
                                    "gst",
                                    "mode_of_payment",
                                    "line_items",
                                  ].includes(key),
                              )
                              .map(([key, value], index) => (
                                <motion.div
                                  key={key}
                                  className="flex justify-between border-b pb-2 last:border-0"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <p className="text-sm font-medium capitalize text-yellow -700">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm text-yellow -800">{value?.toString() || "-"}</p>
                                </motion.div>
                              ))}
                            {Object.entries(parsed).filter(
                              ([key]) =>
                                ![
                                  "vendor",
                                  "invoice_number",
                                  "total_amount",
                                  "total_amount_inr",
                                  "total_amount_usd",
                                  "invoice_date",
                                  "due_date",
                                  "gstin",
                                  "description",
                                  "vendor_address",
                                  "vendor_gstin",
                                  "vendor_pan",
                                  "client_name",
                                  "client_address",
                                  "client_gstin",
                                  "gst",
                                  "mode_of_payment",
                                  "line_items",
                                ].includes(key),
                            ).length === 0 && <p className="text-yellow -600 text-center py-4">No additional fields</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-0">
              <div className="grid gap-6">
                {/* Line Items Table */}
                <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-yellow -800">Line Items</h3>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {parsed.line_items && parsed.line_items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-yellow -200">
                              <th className="text-left py-3 px-4 font-semibold text-yellow -700">Description</th>
                              <th className="text-center py-3 px-4 font-semibold text-yellow -700">Quantity</th>
                              <th className="text-center py-3 px-4 font-semibold text-yellow -700">Unit Price</th>
                              {parsed.line_items[0].cgst && (
                                <th className="text-center py-3 px-4 font-semibold text-yellow -700">CGST</th>
                              )}
                              {parsed.line_items[0].sgst && (
                                <th className="text-center py-3 px-4 font-semibold text-yellow -700">SGST</th>
                              )}
                              <th className="text-right py-3 px-4 font-semibold text-yellow -700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.line_items.map((item, index) => (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border-b border-yellow -200 hover:bg-yellow -50"
                              >
                                <td className="py-4 px-4 text-yellow -800">{item.description}</td>
                                <td className="py-4 px-4 text-center text-yellow -800">{item.quantity}</td>
                                <td className="py-4 px-4 text-center text-yellow -800">${item.unit_price}</td>
                                {item.cgst && <td className="py-4 px-4 text-center text-yellow -800">₹{item.cgst}</td>}
                                {item.sgst && <td className="py-4 px-4 text-center text-yellow -800">₹{item.sgst}</td>}
                                <td className="py-4 px-4 text-right font-medium text-yellow -800">${item.total}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-yellow -50">
                              <td
                                colSpan={parsed.line_items[0].cgst && parsed.line_items[0].sgst ? 5 : 3}
                                className="py-4 px-4 text-right font-semibold text-yellow -700"
                              >
                                Subtotal
                              </td>
                              <td className="py-4 px-4 text-right font-semibold text-yellow -800">
                                ${parsed.total_amount_usd || "-"}
                              </td>
                            </tr>
                            {parsed.gst && (
                              <tr className="bg-yellow -50">
                                <td
                                  colSpan={parsed.line_items[0].cgst && parsed.line_items[0].sgst ? 5 : 3}
                                  className="py-4 px-4 text-right font-semibold text-yellow -700"
                                >
                                  GST
                                </td>
                                <td className="py-4 px-4 text-right font-semibold text-yellow -800">₹{parsed.gst}</td>
                              </tr>
                            )}
                            {parsed.total_amount_inr && (
                              <tr className="bg-yellow -50">
                                <td
                                  colSpan={parsed.line_items[0].cgst && parsed.line_items[0].sgst ? 5 : 3}
                                  className="py-4 px-4 text-right font-bold text-yellow -800"
                                >
                                  Total (INR)
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-yellow -800">
                                  ₹{parsed.total_amount_inr}
                                </td>
                              </tr>
                            )}
                            {parsed.total_amount_usd && (
                              <tr className="bg-yellow -50">
                                <td
                                  colSpan={parsed.line_items[0].cgst && parsed.line_items[0].sgst ? 5 : 3}
                                  className="py-4 px-4 text-right font-bold text-yellow -800"
                                >
                                  Total (USD)
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-yellow -800">
                                  ${parsed.total_amount_usd}
                                </td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-yellow -800">No Line Items</h3>
                        <p className="text-yellow -600 mb-6 max-w-md">No line items were detected in this invoice.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Parsed Fields Table */}
                <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-yellow -800">All Parsed Fields</h3>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-yellow -200">
                            <th className="text-left py-3 px-4 font-semibold text-yellow -700">Field</th>
                            <th className="text-left py-3 px-4 font-semibold text-yellow -700">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(parsed)
                            .filter(([key]) => key !== "line_items")
                            .map(([key, value], index) => (
                              <motion.tr
                                key={key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-yellow -200 hover:bg-yellow -50"
                              >
                                <td className="py-3 px-4 text-yellow -700 font-medium capitalize">
                                  {key.replace(/_/g, " ")}
                                </td>
                                <td className="py-3 px-4 text-yellow -800">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </td>
                              </motion.tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <Card className="overflow-hidden transition-all hover:shadow-lg border-yellow -200">
                <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-yellow -800">Invoice Preview</h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  {invoice.attachment ? (
                    <div>
                      <div className="flex justify-end mb-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="transition-all shadow-md bg-blue-600 hover:bg-blue-700"
                            onClick={() => setShowPdfPreview(true)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View PDF
                          </Button>
                        </motion.div>
                      </div>
                      <div className="border rounded-lg overflow-hidden bg-yellow -100 h-[400px] flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-yellow -800">Invoice PDF</h3>
                          <p className="text-yellow -600 mb-6">Click the button above to preview the invoice.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-yellow -800">No PDF Available</h3>
                      <p className="text-yellow -600 mb-6 max-w-md">
                        The original invoice PDF is not available for this invoice.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-yellow  border-t border-yellow -200 p-4 flex justify-between">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!invoice.attachment}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={status === "approved"}
              className={status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {status === "approved" ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved
                </div>
              ) : (
                "Approve"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={status === "rejected"}
              className={status === "rejected" ? "border-red-200 text-red-600" : "border-yellow -200 text-yellow -700"}
            >
              {status === "rejected" ? (
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejected
                </div>
              ) : (
                "Reject"
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPdfPreview && invoice.attachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-yellow  rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg text-yellow -800">Invoice PDF Preview</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPdfScale((prev) => Math.min(prev + 0.25, 2))}
                    className="h-8 w-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPdfScale((prev) => Math.max(prev - 0.25, 0.5))}
                    className="h-8 w-8"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowPdfPreview(false)} className="h-8 w-8">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-yellow -100">
                <div
                  style={{ transform: `scale(${pdfScale})`, transformOrigin: "top center" }}
                  className="bg-yellow  shadow-md mx-auto"
                >
                  <iframe
                    src={`data:application/pdf;base64,${invoice.attachment}`}
                    className="w-full h-[70vh]"
                    title="Invoice PDF"
                  />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end">
                <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
