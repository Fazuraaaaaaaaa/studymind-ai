"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SummaryView } from "./SummaryView"
import { FlashcardDeck } from "./FlashcardDeck"
import { QuizPanel } from "./QuizPanel"
import { TutorAIPanel } from "./TutorAIPanel"
import { BookOpen, Layers, BrainCircuit, MessageSquare, Sparkles } from "lucide-react"
import type { GenerationResult } from "@/types"

interface ResultsTabsProps {
  result: GenerationResult
}

export function ResultsTabs({ result }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState("summary")

  const tabList = [
    { id: "summary", label: "Ringkasan", icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
    { id: "flashcards", label: "Flashcards", icon: Layers, color: "text-amber-600 bg-amber-50" },
    { id: "quiz", label: "Kuis Interaktif", icon: BrainCircuit, color: "text-emerald-600 bg-emerald-50" },
    { id: "tutor", label: "Tutor AI", icon: MessageSquare, color: "text-pink-600 bg-pink-50" },
  ]

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* 3D Floating Tab Navigation */}
      <div className="sticky top-20 z-30 mb-8 px-2">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-2 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.12)] backdrop-blur-xl border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-xs sm:text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "text-indigo-900 shadow-md shadow-indigo-500/10 bg-white border border-indigo-100"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
                  }`}
                  style={{
                    transform: isActive ? "translateY(-2px)" : "none",
                  }}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? tab.color : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1 left-4 right-4 h-0.5 rounded-full bg-indigo-600"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area with 3D Fade-in Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="perspective-1200"
        >
          {activeTab === "summary" && <SummaryView summary={result.summary} />}
          {activeTab === "flashcards" && <FlashcardDeck flashcards={result.flashcards} />}
          {activeTab === "quiz" && <QuizPanel questions={result.quiz} />}
          {activeTab === "tutor" && <TutorAIPanel contextText={result.summary} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

