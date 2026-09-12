"use client"

import { useRef, ReactNode } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
  innerClassName?: string
  depth?: number
}

export function TiltCard({
  children,
  className,
  innerClassName,
  depth = 30,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 260 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const rotateX = useTransform(springY, [-0.5, 0.5], [14, -14])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px)
    y.set(py)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <div className={cn("perspective-1200", className)} style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn("w-full h-full relative transition-all duration-200", innerClassName)}
      >
        <div
          style={{ transform: `translateZ(${depth}px)`, transformStyle: "preserve-3d" }}
          className="w-full h-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}
