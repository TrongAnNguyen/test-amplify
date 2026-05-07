'use client'

import { useState } from 'react'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SignUpPhaseProps {
  onSignUp: (email: string) => Promise<void>
  isLoading: boolean
  error?: string
}

export function SignUpPhase({ onSignUp, isLoading, error }: SignUpPhaseProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onSignUp(email)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Create Account</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your email to start your journey
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-12 outline-hidden transition-all focus:ring-2"
            />
          </div>
        </div>
        {error && <p className="text-destructive text-xs font-medium">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="group bg-primary text-primary-foreground hover:bg-primary/90 relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-primary cursor-pointer text-sm font-medium transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  )
}
