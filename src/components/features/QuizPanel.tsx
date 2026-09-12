"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, RotateCcw, Trophy, BrainCircuit, Sparkles, ArrowRight } from "lucide-react"
import { MarkdownText } from "@/components/ui/markdown-text"
import type { QuizQuestion } from "@/types"

type QuizPanelProps = {
  questions: QuizQuestion[]
}

export function QuizPanel({ questions }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)

  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === total && total > 0

  const score = questions.reduce(
    (acc, q, index) => acc + (answers[index] === q.correctAnswerIndex ? 1 : 0),
    0
  )
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (answers[questionIndex] !== undefined) return
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
  }

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-slate-400">
        Kuis tidak tersedia untuk materi ini.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 3D Floating Progress Bar */}
      <div className="sticky top-20 z-20 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_10px_30px_rgba(79,70,229,0.08)] backdrop-blur-xl">
        <div className="mb-2.5 flex items-center justify-between text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BrainCircuit className="h-3.5 w-3.5" />
            </div>
            <span>Progres Pemahaman</span>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
            {answeredCount} / {total} Terjawab
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-400"
            initial={{ width: 0 }}
            animate={{ width: `${(answeredCount / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {showResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-8 sm:p-12 text-center shadow-[0_25px_60px_-15px_rgba(79,70,229,0.15)] backdrop-blur-xl"
        >
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-white shadow-xl shadow-amber-400/30"
          >
            <Trophy className="h-12 w-12" />
          </motion.div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-600 border border-indigo-100 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Hasil Evaluasi Kuis
          </span>

          <h2 className="mb-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Skor Kamu: <span className="text-indigo-600">{percentage}%</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm sm:text-base text-slate-500 leading-relaxed">
            Kamu berhasil menjawab benar <strong className="text-slate-800">{score}</strong> dari <strong className="text-slate-800">{total}</strong> soal.{" "}
            {percentage >= 70
              ? "Luar biasa! Pemahaman konsepmu sangat kuat!"
              : "Bagus! Terus tingkatkan dengan membaca kembali rangkuman materi."}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition"
            >
              <RotateCcw className="h-4 w-4" /> Ulangi Kuis
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <QuizQuestionCard
              key={q.id ?? qIndex}
              question={q}
              index={qIndex}
              selected={answers[qIndex]}
              onSelect={handleSelect}
            />
          ))}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResult(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-sm sm:text-base font-black text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40"
              >
                <span>Lihat Hasil Akhir</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

type QuizQuestionCardProps = {
  question: QuizQuestion
  index: number
  selected?: number
  onSelect: (questionIndex: number, optionIndex: number) => void
}

function QuizQuestionCard({
  question,
  index,
  selected,
  onSelect,
}: QuizQuestionCardProps) {
  const isAnswered = selected !== undefined
  const isCorrect = isAnswered && selected === question.correctAnswerIndex

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_45px_-5px_rgba(79,70,229,0.08)]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-sm">
            {index + 1}
          </span>
          <div className="flex-1">
            <MarkdownText className="text-base sm:text-lg font-bold leading-relaxed text-slate-900">
              {question.question}
            </MarkdownText>
          </div>
        </div>

        {isAnswered && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
            {isCorrect ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt, optIdx) => {
          const isSelected = selected === optIdx
          const isCorrectOption = optIdx === question.correctAnswerIndex

          let styleClass = "bg-white/80 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"

          if (isAnswered) {
            if (isCorrectOption) {
              styleClass = "bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-sm shadow-emerald-500/10 font-semibold"
            } else if (isSelected) {
              styleClass = "bg-rose-50/90 border-rose-500 text-rose-900 shadow-sm shadow-rose-500/10 font-semibold"
            } else {
              styleClass = "bg-slate-50/40 border-slate-100 text-slate-400 opacity-60"
            }
          }

          return (
            <motion.button
              key={optIdx}
              disabled={isAnswered}
              whileHover={!isAnswered ? { y: -2, scale: 1.01 } : {}}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => onSelect(index, optIdx)}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${!isAnswered ? "cursor-pointer" : "cursor-default"} ${styleClass}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${
                  isAnswered && isCorrectOption
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : isAnswered && isSelected
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                    : isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {String.fromCharCode(65 + optIdx)}
              </div>
              <div className="flex-1 leading-snug">
                <MarkdownText className="text-sm">{opt}</MarkdownText>
              </div>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden rounded-2xl border p-4 sm:p-5 mt-5 text-sm leading-relaxed ${
              isCorrect
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                : "border-rose-200 bg-rose-50/70 text-rose-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="font-black shrink-0">
                {isCorrect ? "✨ Pembahasan:" : "💡 Penjelasan:"}
              </span>
              <div className="flex-1">
                <MarkdownText className="text-sm leading-relaxed">
                  {question.explanation}
                </MarkdownText>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
