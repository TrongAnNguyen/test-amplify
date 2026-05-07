'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import { AnimatedBackground } from '@/components/auth/AnimatedBackground'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignUpPhase } from '@/components/auth/SignUpPhase'
import { ConfirmSignUpPhase } from '@/components/auth/ConfirmSignUpPhase'
import { AnimatePresence, motion } from 'framer-motion'

export function SignUpClient() {
  const router = useRouter()
  const [step, setStep] = useState<'SIGN_UP' | 'CONFIRM'>('SIGN_UP')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSignUp = async (emailValue: string) => {
    setIsLoading(true)
    setError(undefined)
    try {
      setEmail(emailValue)
      const { nextStep } = await signUp({
        username: emailValue,
        options: {
          userAttributes: {
            email: emailValue,
          },
        },
      })

      if (nextStep.signUpStep === 'DONE') {
        router.push('/welcome')
      } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('CONFIRM')
      } else {
        setError('Unexpected signup step: ' + nextStep.signUpStep)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmSignUp = async (code: string) => {
    setIsLoading(true)
    setError(undefined)
    try {
      const { nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      })

      if (nextStep.signUpStep === 'DONE') {
        router.push('/welcome')
      } else {
        setError('Signup not complete. Step: ' + nextStep.signUpStep)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <AuthCard>
        <AnimatePresence mode="wait">
          {step === 'SIGN_UP' ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SignUpPhase onSignUp={handleSignUp} isLoading={isLoading} error={error} />
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ConfirmSignUpPhase
                email={email}
                onVerify={handleConfirmSignUp}
                onResend={() => handleSignUp(email)}
                onBack={() => setStep('SIGN_UP')}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  )
}
