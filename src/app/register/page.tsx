"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const enrollAfter = searchParams.get('enroll') === '1';
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Validate form data with Zod
      const validatedData = registerSchema.parse({
        email,
        password,
        name,
      })

      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Registration failed")
      }

      // Auto sign-in after registration
      const sign = await signIn("credentials", { redirect: false, email, password })
      if (sign?.error) throw new Error("Auto sign-in failed")
      
      if (enrollAfter) {
        router.push("/?paynow=1");
      } else {
        // Check user role to determine redirect
        try {
          const userRes = await fetch('/api/auth/session')
          const session = await userRes.json()
          
          if (session?.user?.role === 'ADMIN') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        } catch (error) {
          // Fallback to dashboard if session fetch fails
          router.push('/dashboard')
        }
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0]
        setError(firstError.message)
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-2">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-brand-neutral-light px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors"
          placeholder="Enter your name"
        />
      </div>
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
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  )
}

export default function RegisterPage() {
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
              <h1 className="text-3xl font-bold text-brand-primary mb-2">Create Account</h1>
              <p className="text-gray-600">Join our music curriculum community</p>
            </div>

            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            }>
              <RegisterForm />
            </Suspense>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
