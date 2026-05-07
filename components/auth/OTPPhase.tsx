'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, ShieldCheck, RefreshCw } from 'lucide-react'

interface OTPPhaseProps {
  email: string
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
  isLoading: boolean
  error?: string
}

export function OTPPhase({ email, onVerify, onResend, onBack, isLoading, error }: OTPPhaseProps) {
  const [otp, setOtp] = useState<string[]>(new Array(8).fill(''))
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0 || isLoading) return
    try {
      await onResend()
      setCountdown(30)
    } catch (error) {
      console.error('Failed to resend code:', error)
    }
  }

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return

    const newOtp = [...otp]
    newOtp[index] = element.value
    setOtp(newOtp)

    // Focus next input
    if (element.value !== '' && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newOtp.every((v) => v !== '') && !isLoading) {
      onVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData('text').trim()
    if (data.length === 8 && !isNaN(Number(data)) && !isLoading) {
      const newOtp = data.split('')
      setOtp(newOtp)
      onVerify(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <ShieldCheck className="text-primary h-6 w-6" />
        </div>
        <h2 className="text-foreground text-2xl font-bold tracking-tight">Check your email</h2>
        <div className="text-muted-foreground mt-2 flex items-center justify-center gap-2 text-sm">
          <span>
            We&apos;ve sent an 8-digit code to{' '}
            <span className="text-foreground font-semibold">{email}</span>
          </span>
          <button
            onClick={onBack}
            type="button"
            className="text-primary hover:text-primary/80 cursor-pointer text-xs font-medium transition-colors"
          >
            Change
          </button>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            autoFocus={index === 0}
            className="border-border bg-background/50 focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border text-center text-xl font-bold outline-hidden focus:ring-2"
          />
        ))}
      </div>

      {error && <p className="text-destructive text-center text-xs font-medium">{error}</p>}

      <div className="flex flex-col space-y-4">
        <button
          onClick={() => onVerify(otp.join(''))}
          disabled={isLoading || otp.some((v) => v === '')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full cursor-pointer items-center justify-center rounded-xl py-3 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
        </button>

        <button
          onClick={handleResend}
          disabled={isLoading || countdown > 0}
          className="text-muted-foreground hover:text-primary flex cursor-pointer items-center justify-center text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
