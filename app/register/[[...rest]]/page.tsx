"use client"

import { SignUp } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />
      
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold kinetic-shimmer-accent">
              Paytree
            </h1>
          </Link>
          <p className="text-sm sm:text-base text-gray-400 mt-2">Create your free account</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-300",
                socialButtonsBlockButton: "bg-white/10 border-white/20 hover:bg-white/20 text-white",
                socialButtonsBlockButtonText: "text-white",
                formFieldLabel: "text-gray-200",
                formFieldInput: "bg-white/5 border-white/20 text-white placeholder:text-gray-400",
                formButtonPrimary: "bg-[#00ff88] text-[#030303] hover:bg-[#00cc6a] font-bold",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-blue-400",
              }
            }}
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl={undefined}
          />
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-3 text-sm">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign in
            </Link>
          </p>
          
          <div className="glass rounded-lg p-4 text-left space-y-2">
            <p className="font-semibold text-white">✨ Free Plan Includes:</p>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Create and customize your page</li>
              <li>• Add up to 2 links</li>
              <li>• Preview your page anytime</li>
              <li>• Upgrade to Pro to publish ($4.99/mo)</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
