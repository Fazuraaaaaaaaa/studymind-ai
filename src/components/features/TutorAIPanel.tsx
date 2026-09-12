"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, User, Loader2, Sparkles, Bot } from "lucide-react"
import { MarkdownText } from "@/components/ui/markdown-text"

interface Message {
  role: "user" | "ai"
  content: string
}

export function TutorAIPanel({ contextText }: { contextText: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Halo! Aku Tutor AI FazuraEdu. Ada rumus atau konsep yang membingungkan? Tanyakan langsung ke aku!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, contextText }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mendapatkan respon")

      setMessages((prev) => [...prev, { role: "ai", content: data.reply }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Maaf, sistem sedang sibuk. Silakan coba tanyakan kembali ya!",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative mx-auto flex h-[580px] max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.12)] backdrop-blur-xl">
      {/* 3D Glass Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            </span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Tutor AI Pribadi</h4>
            <p className="text-[11px] font-medium text-slate-400">Siap menjawab 24/7 seputar materi ini</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 border border-indigo-100">
          <Sparkles className="h-3 w-3" /> Aktif
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                msg.role === "user"
                  ? "bg-slate-900 text-white shadow-slate-900/20"
                  : "bg-indigo-600 text-white shadow-indigo-600/20"
              }`}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "rounded-tr-xs bg-slate-900 text-white"
                  : "rounded-tl-xs border border-slate-100 bg-slate-50/80 text-slate-800"
              }`}
            >
              <MarkdownText className={msg.role === "user" ? "text-white" : "text-slate-800"}>
                {msg.content}
              </MarkdownText>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Tutor sedang berpikir dan merumuskan jawaban...</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-white/80 p-4 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan konsep atau rumus yang belum kamu pahami..."
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
