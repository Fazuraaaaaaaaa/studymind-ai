"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Copy, Check, Sparkles, BookOpen, Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function SummaryView({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 p-6 sm:p-10 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.08)] overflow-hidden">
      {/* 3D Ambient Background Lights */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* 3D Elevated Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Rangkuman Materi Cerdas
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 border border-indigo-100">
                <Sparkles className="h-3 w-3" /> AI Generated
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Poin-poin esensial & konsep terstruktur siap dipelajari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin Ringkasan</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Rangkuman Markdown Body with Rich Typography & KaTeX */}
      <div className="relative z-10 prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base prose-headings:font-black prose-headings:text-slate-900 prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:text-indigo-950 prose-strong:font-bold">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  )
}
