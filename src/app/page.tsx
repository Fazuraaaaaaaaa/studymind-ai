"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ResultsTabs } from "@/components/features/ResultsTabs"
import { ResultSkeleton } from "@/components/features/ResultSkeleton"
import type { GenerationResult } from "@/types"

import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { TestimonialSection } from "@/components/landing/TestimonialSection"
import { FaqSection } from "@/components/landing/FaqSection"

export default function Home() {
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/20 selection:text-indigo-700">
      
      {/* 🌟 Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
              F
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Fazura<span className="text-indigo-600">Edu</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <a href="#fitur" className="hover:text-indigo-600 transition-colors">Fitur</a>
            <a href="#testimoni" className="hover:text-indigo-600 transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>
        </div>
      </header>

      {/* 🚀 Hero Section (Input) */}
      <HeroSection onResult={(res) => setResult(res)} isLoading={isLoading} setIsLoading={setIsLoading} />

      {/* 📊 Results Section */}
      <section id="study-result" className="w-full pb-24">
        {isLoading && <ResultSkeleton />}
        {result && (
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 animate-fade-up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/80 shadow-sm mb-4">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-indigo-700 uppercase">Analisis Selesai</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Materi Belajarmu Siap! 🎉
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl mx-auto font-medium">
                Kami telah menyusun materi ini menjadi ringkasan cerdas, flashcard interaktif, dan kuis evaluasi. Selamat belajar!
              </p>
            </div>
            <ResultsTabs result={result} />
          </div>
        )}
      </section>

      <FeaturesSection />
      <TestimonialSection />
      <FaqSection />

      {/* 🏁 Call to Action Banner */}
      <section className="py-24 bg-slate-900 text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-900"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-5">
            Siap Merevolusi Cara Belajarmu?
          </h2>
          <p className="text-slate-400 font-medium text-base mb-10 max-w-xl mx-auto">
            Bergabunglah dengan ribuan pelajar berprestasi lainnya. Pahami konsep tersulit dalam hitungan detik bersama FazuraEdu.
          </p>
          <Button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }}
            size="lg"
            className="font-bold rounded-2xl px-8 h-14 bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
          >
            Mulai Gratis Sekarang
          </Button>
        </div>
      </section>

      {/* 🦶 Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs font-medium text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">F</span>
            FazuraEdu
          </div>
          <p>© 2026 FazuraEdu by StudyMind AI. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
