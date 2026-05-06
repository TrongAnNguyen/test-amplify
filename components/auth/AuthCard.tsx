'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-black/20"
    >
      <div className="flex flex-col space-y-6">{children}</div>
    </motion.div>
  )
}
