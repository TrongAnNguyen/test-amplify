'use client'

import { useState } from 'react'
import { Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'

interface NewPasswordPhaseProps {
  onSubmit: (password: string) => Promise<void>
  isLoading: boolean
  error?: string
}

export function NewPasswordPhase({ onSubmit, isLoading, error }: NewPasswordPhaseProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(undefined)

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setValidationError('Password must contain at least one special character')
      return
    }

    if (!/[0-9]/.test(password)) {
      setValidationError('Password must contain at least one number')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Create New Password</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          You need to set a new password for your account
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-12 outline-hidden transition-all focus:ring-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <ShieldCheck className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-12 outline-hidden transition-all focus:ring-2"
            />
          </div>
        </div>

        {(error || validationError) && (
          <p className="text-destructive text-xs font-medium">{error || validationError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !password || !confirmPassword}
        className="group bg-primary text-primary-foreground hover:bg-primary/90 relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Set Password & Sign In
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  )
}
