'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { LogOut, Loader2, PartyPopper } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/auth/AnimatedBackground'
import { AuthCard } from '@/components/auth/AuthCard'

export default function WelcomePage() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <AuthCard>
        <div className="space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="bg-primary/10 rounded-full p-4">
              <PartyPopper className="text-primary h-12 w-12" />
            </div>
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-foreground text-3xl font-bold tracking-tight">
              Welcome to the Network
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account has been successfully created and is currently awaiting administrator
              activation. We&apos;ll notify you as soon as your access is granted.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="group border-border bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 text-muted-foreground relative flex w-full cursor-pointer items-center justify-center rounded-xl border py-3 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
