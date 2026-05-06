'use client'

import { useState, useEffect } from 'react'
import { Mail, ArrowRight, Loader2, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LOCAL_STORAGE_KEY, LOGIN_METHOD } from '@/utils/constants'

export type LoginMethod = 'otp' | 'password'

interface EmailPhaseProps {
  onLogin: (email: string, method: LoginMethod, password?: string) => Promise<void>
  isLoading: boolean
  error?: string
}

export function EmailPhase({ onLogin, isLoading, error }: EmailPhaseProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState<LoginMethod>('password')

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY.LOGIN_METHOD)
    if (saved === LOGIN_METHOD.PASSWORDLESS) {
      setMethod('otp')
    }
  }, [])

  const toggleMethod = () => {
    const newMethod = method === 'otp' ? 'password' : 'otp'
    setMethod(newMethod)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      onLogin(email, method, method === 'password' ? password : undefined)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {method === 'otp'
            ? 'Enter your email to receive a secure login code'
            : 'Enter your email and password to sign in'}
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
              className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-12 outline-hidden transition-all focus:ring-2"
            />
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {method === 'password' && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={method === 'password'}
                  className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-12 outline-hidden transition-all focus:ring-2"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-destructive text-xs font-medium">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || !email || (method === 'password' && !password)}
        className="group bg-primary text-primary-foreground hover:bg-primary/90 relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {method === 'otp' ? 'Send Login Code' : 'Sign In'}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={toggleMethod}
          className="text-muted-foreground hover:text-primary cursor-pointer text-sm font-medium transition-colors"
        >
          {method === 'otp' ? 'Login with password' : 'Login with OTP code'}
        </button>
      </div>
    </form>
  )
}
