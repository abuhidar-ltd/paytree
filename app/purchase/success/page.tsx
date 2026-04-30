"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { GlassBrick } from "@/components/ui/obsidian-card"

interface PurchaseDetails {
  productTitle: string
  downloadUrl?: string
  downloadName?: string
  sellerUsername: string
}

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [details, setDetails] = useState<PurchaseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (!sessionId) {
        setError("Invalid session")
        setIsLoading(false)
        return
      }
      
      try {
        const res = await fetch(`/api/purchase/verify?session_id=${sessionId}`)
        if (!res.ok) throw new Error("Failed to verify purchase")
        
        const data = await res.json()
        setDetails(data)
      } catch (err) {
        setError("Could not verify your purchase. Please check your email for download details.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDetails()
  }, [sessionId])
  
  return (
    <div className="min-h-screen bg-[#030303] text-white relative flex items-center justify-center p-6">
      <PremiumBackground />
      
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassBrick className="p-8 text-center">
          {isLoading ? (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#888888]">Verifying your purchase...</p>
            </div>
          ) : error ? (
            <>
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
              <p className="text-[#888888] mb-6">{error}</p>
              <Link href="/">
                <motion.button
                  className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.1)] text-white font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go Home
                </motion.button>
              </Link>
            </>
          ) : details ? (
            <>
              {/* Success Animation */}
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc6a] mx-auto mb-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.svg
                  className="w-10 h-10 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-2">Purchase Successful!</h1>
              <p className="text-[#888888] mb-6">
                Thank you for purchasing <span className="text-white">{details.productTitle}</span>
              </p>
              
              {/* Download Button */}
              {details.downloadUrl && (
                <motion.a
                  href={details.downloadUrl}
                  download={details.downloadName}
                  className="
                    block w-full py-4 rounded-xl mb-4
                    bg-gradient-to-r from-[#00ff88] to-[#00cc6a]
                    text-black font-bold text-lg
                    flex items-center justify-center gap-2
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {details.downloadName || "File"}
                </motion.a>
              )}
              
              <p className="text-sm text-[#888888] mb-6">
                A copy has also been sent to your email.
              </p>
              
              <Link href={`/${details.sellerUsername}`}>
                <motion.button
                  className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.1)] text-white font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to {details.sellerUsername}
                </motion.button>
              </Link>
            </>
          ) : null}
        </GlassBrick>
      </motion.div>
    </div>
  )
}
