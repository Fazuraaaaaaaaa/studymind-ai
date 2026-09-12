"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, Sparkles, Layers } from "lucide-react"
import { MarkdownText } from "@/components/ui/markdown-text"
import { Flashcard } from "@/types"

export function FlashcardDeck({ flashcards: initialCards }: { flashcards: Flashcard[] }) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!cards || cards.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-slate-400">
        Tidak ada flashcard tersedia.
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleShuffle = () => {
    setIsFlipped(false)
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6">
      {/* Top Controls Bar */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/80 shadow-sm">
            <Layers className="h-3.5 w-3.5 text-amber-600" />
            Kartu {currentIndex + 1} dari {cards.length}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Shuffle className="h-3.5 w-3.5 text-slate-500" />
          <span>Acak Kartu</span>
        </motion.button>
      </div>

      {/* 3D Stacked Deck Area */}
      <div className="relative h-80 sm:h-96 w-full [perspective:1400px]">
        {/* Background Stack Layer 2 */}
        <div
          className="absolute inset-0 rounded-3xl bg-indigo-100/60 border border-indigo-200/60 shadow-md transition-all duration-300"
          style={{
            transform: "translateY(16px) scale(0.92) rotate(-3deg)",
            zIndex: 1,
          }}
        />

        {/* Background Stack Layer 1 */}
        <div
          className="absolute inset-0 rounded-3xl bg-amber-100/60 border border-amber-200/60 shadow-lg transition-all duration-300"
          style={{
            transform: "translateY(8px) scale(0.96) rotate(2deg)",
            zIndex: 2,
          }}
        />

        {/* Active Flipping Card */}
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.93, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 h-full w-full cursor-pointer select-none [transform-style:preserve-3d]"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="h-full w-full [transform-style:preserve-3d] rounded-3xl shadow-[0_25px_60px_-15px_rgba(79,70,229,0.18)]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            {/* FRONT SIDE (Question) */}
            <div className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-3xl border border-white/90 bg-white/95 p-8 sm:p-10 backdrop-blur-xl [backface-visibility:hidden]">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-black tracking-wider text-indigo-600 uppercase">
                  <Sparkles className="h-3.5 w-3.5" /> Pertanyaan
                </span>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  <RotateCw className="h-3 w-3" /> Putar
                </span>
              </div>

              <div className="my-auto flex items-center justify-center text-center px-2">
                <MarkdownText className="text-lg sm:text-2xl font-bold leading-relaxed text-slate-900">
                  {currentCard.question}
                </MarkdownText>
              </div>

              <div className="text-center text-xs font-medium text-slate-400">
                Ketuk kartu untuk melihat jawaban 💡
              </div>
            </div>

            {/* BACK SIDE (Answer) */}
            <div className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/95 to-white/95 p-8 sm:p-10 backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-black tracking-wider text-emerald-600 uppercase">
                  ✨ Kunci Jawaban
                </span>
                <span className="flex items-center gap-1 rounded-full bg-indigo-100/70 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                  <RotateCw className="h-3 w-3" /> Kembali
                </span>
              </div>

              <div className="my-auto flex items-center justify-center text-center px-2">
                <MarkdownText className="text-base sm:text-xl font-bold leading-relaxed text-indigo-950">
                  {currentCard.answer}
                </MarkdownText>
              </div>

              <div className="text-center text-xs font-medium text-indigo-400">
                Ketuk kartu untuk kembali ke pertanyaan
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 3D Navigation Controls */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrev}
          disabled={cards.length <= 1}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg disabled:opacity-40"
        >
          <ChevronLeft className="h-6 w-6" />
        </motion.button>

        <span className="text-xs sm:text-sm font-semibold text-slate-500">
          Geser atau klik tombol navigasi
        </span>

        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNext}
          disabled={cards.length <= 1}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg disabled:opacity-40"
        >
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  )
}
