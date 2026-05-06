'use client'

import { motion } from 'framer-motion'

export function AnimatedBackground() {
  return (
    <div className="bg-background fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [-100, 100, -100],
          y: [-50, 50, -50],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="bg-primary/20 absolute top-[-20%] left-[-10%] h-[80%] w-[80%] rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -120, 0],
          x: [100, -100, 100],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="bg-accent/20 absolute right-[-10%] bottom-[-20%] h-[70%] w-[70%] rounded-full blur-[100px]"
      />
    </div>
  )
}
