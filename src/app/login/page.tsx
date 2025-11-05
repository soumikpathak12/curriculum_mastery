"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })
    setLoading(false)
    if (res?.error) {
      setError("Invalid email or password")
      return
    }
    
    // Check if there's a specific callback URL
    const callbackUrl = search.get("callbackUrl")
    if (callbackUrl) {
      // Use window.location for immediate redirect (faster than router.push)
      window.location.href = callbackUrl
      return
    }
    
    // Refresh session and redirect - use window.location for immediate redirect
    // This avoids the delay from fetching session and using router
    router.refresh()
    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-2">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border-2 border-brand-neutral-light px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors"
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-2">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border-2 border-brand-neutral-light px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors"
          placeholder="Enter your password"
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-primary px-6 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-background">
      {/* Header */}
      <div className="flex w-full items-center justify-between pl-4 pr-2 py-2 sm:pl-6 sm:pr-3 sm:py-3">
        <Link href="/" className="flex items-center gap-1 hover:opacity-90 transition-opacity">
          <Image 
            src="/assets/curriculum-mastery-logo-small.png" 
            alt="Curriculum Mastery Logo" 
            width={288} 
            height={288} 
            className="h-[108px] w-auto sm:h-[144px]"
            priority
          />
          <div className="flex flex-col">
            <span className="text-xl sm:text-3xl font-bold text-brand-primary leading-tight tracking-wide">Curriculum</span>
            <span className="text-2xl sm:text-4xl font-bold text-brand-primary leading-tight uppercase">MASTERY</span>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-primary mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to access your music curriculum</p>
            </div>

            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
