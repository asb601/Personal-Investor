"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IndianRupee } from "lucide-react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useRouter } from "next/navigation"
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { user, loading, login } = useAuth();

  // If the user already has an active session, skip login entirely
  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  // the provider needs a valid client ID at runtime; it must be
  // specified using the NEXT_PUBLIC_ prefix so it is available both
  // during server rendering and in the browser.  We intentionally
  // *don't* fall back to non‑prefixed names, since that would create
  // mismatches between the two environments (which is what triggered
  // the hydration error you saw).
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  if (typeof window !== "undefined" && !GOOGLE_CLIENT_ID) {
    console.warn(
      "Google client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local"
    )
  }

  const handleSuccess = async (credentialResponse: any) => {
    const googleToken = credentialResponse.credential
    setIsLoggingIn(true)

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: googleToken,
        }),
      })

      if (!res.ok) {
        throw new Error(`server responded with ${res.status}`)
      }

      const data = await res.json()

      // the server sets a http-only cookie; we just keep the user object
      if (data.user) {
        login(data.user)
        router.push("/home")
      }
    } catch (err) {
      console.error("Login failed", err)
      setIsLoggingIn(false)
    }
  }

  if (loading || isLoggingIn) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {isLoggingIn ? "Signing you in…" : "Checking session…"}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-6 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg group-hover:shadow-xl transition-shadow">
              <IndianRupee className="w-8 h-8 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold">FinOS</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome Back
          </h1>

          <p className="mt-3 text-base text-muted-foreground max-w-sm">
            Sign in to your Personal Financial Intelligence OS
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 sm:p-10">

          <div className="space-y-6 flex flex-col items-center">

            {/* Google Login */}
            {GOOGLE_CLIENT_ID ? (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => {
                    console.log("Google Login Failed")
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="300"
                />
              </GoogleOAuthProvider>
            ) : (
              <div className="text-sm text-red-600">
                Google Client ID not configured
              </div>
            )}

          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">
                Secure Sign In
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="#"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </p>

        </div>

      </div>
    </div>
  )
}