'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, confirmSignIn } from 'aws-amplify/auth'
import { AnimatedBackground } from '@/components/auth/AnimatedBackground'
import { AuthCard } from '@/components/auth/AuthCard'
import { EmailPhase } from '@/components/auth/EmailPhase'
import { OTPPhase } from '@/components/auth/OTPPhase'
import { AnimatePresence, motion } from 'framer-motion'
import { LOCAL_STORAGE_KEY, LOGIN_METHOD } from '@/utils/constants'

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const persistPasswordLessLoginMethod = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY.LOGIN_METHOD, LOGIN_METHOD.PASSWORDLESS)
  }

  const handleLogin = async (emailValue: string) => {
    setIsLoading(true)
    setError(undefined)
    try {
      setEmail(emailValue)
      const { nextStep } = await signIn({
        username: emailValue,
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      })

      if (nextStep.signInStep === 'DONE') {
        persistPasswordLessLoginMethod()
        router.replace(redirect)
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
        setStep('OTP')
      } else {
        setError('Unexpected sign-in step: ' + nextStep.signInStep)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true)
    setError(undefined)
    try {
      const { nextStep } = await confirmSignIn({
        challengeResponse: code,
      })

      if (nextStep.signInStep === 'DONE') {
        persistPasswordLessLoginMethod()
        router.replace(redirect)
      } else {
        setError('Sign in not complete. Step: ' + nextStep.signInStep)
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
          {step === 'LOGIN' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <EmailPhase onLogin={handleLogin} isLoading={isLoading} error={error} />
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OTPPhase
                email={email}
                onVerify={handleVerifyCode}
                onResend={() => handleLogin(email)}
                onBack={() => setStep('LOGIN')}
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
