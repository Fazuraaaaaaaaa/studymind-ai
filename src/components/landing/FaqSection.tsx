"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs = [
    {
      q: "Apa itu FazuraEdu?",
      a: "FazuraEdu adalah platform EdTech cerdas yang menggunakan AI untuk merangkum otomatis file dokumen (PDF, Word, PPT), foto materi, atau YouTube kamu menjadi ringkasan poin inti, flashcard hafalan 3D, kuis interaktif, dan menyediakan ruang diskusi bersama AI.",
    },
    {
      q: "Apakah FazuraEdu benar-benar gratis?",
      a: "Ya! Misi utama kami adalah pemerataan akses pendidikan berkelas premium untuk seluruh siswa di Indonesia, sehingga kamu bisa menggunakan semua fitur inti kami secara gratis.",
    },
    {
      q: "Format dokumen apa yang didukung?",
      a: "Saat ini kami mendukung teks/catatan bebas, file dokumen berformat PDF, Word (.docx/.doc), PowerPoint (.pptx/.ppt), Excel, file Teks, dan Gambar foto catatan (maksimal 10MB per file), serta ekstraksi materi langsung dari tautan video YouTube.",
    },
  ]

  return (
    <section id="faq" className="py-24 max-w-3xl mx-auto px-4 sm:px-6 w-full bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-slate-900">
          Pertanyaan Umum
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx
          return (
            <div 
              key={idx} 
              className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
              >
                <span className="font-bold text-slate-900 text-base">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-500" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-6 text-sm font-medium text-slate-500 leading-relaxed">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
