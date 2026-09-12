"use client"

import { BookOpen, Layers, BrainCircuit, MessageSquareQuote, FileText, PlayCircle, Mic, Video } from "lucide-react"
import { motion } from "framer-motion"
import { TiltCard } from "@/components/ui/tilt-card"

const features = [
  {
    title: "Upload Multi-Format",
    desc: "Satu tombol upload untuk semua materi: PDF, Word, PowerPoint, Excel, catatan teks, hingga foto tulisan tangan. Bisa beberapa file sekaligus.",
    icon: FileText,
    color: "text-sky-500",
    bg: "bg-sky-50"
  },
  {
    title: "Ringkasan Otomatis",
    desc: "Ubah dokumen ratusan halaman menjadi poin-poin penting yang sangat rapi dan mudah dipahami dalam hitungan detik.",
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-50"
  },
  {
    title: "Smart Flashcards",
    desc: "Hafalkan istilah sulit dengan metode Spaced Repetition yang dianimasikan 3D interaktif. Terbukti efektif untuk memori jangka panjang.",
    icon: Layers,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  {
    title: "Kuis Interaktif",
    desc: "Uji pemahamanmu segera setelah materi dirangkum dengan kuis pilihan ganda plus pembahasan mendalam di setiap jawaban.",
    icon: BrainCircuit,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    title: "Tutor FazuraEdu AI 24/7",
    desc: "Punya pertanyaan seputar materi? Chat langsung dengan Tutor AI yang paham persis konteks dari materi yang baru kamu upload.",
    icon: MessageSquareQuote,
    color: "text-pink-500",
    bg: "bg-pink-50"
  }
]

export function FeaturesSection() {
  return (
    <section id="fitur" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2 block">
            Ekosistem Belajar Lengkap
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            Satu Platform, Semua Kebutuhan
          </h2>
          <p className="text-slate-500 text-base leading-relaxed">
            FazuraEdu dirancang dengan desain premium dan metode sains kognitif modern untuk membuat pengalaman belajarmu tidak membosankan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i}
            >
              <TiltCard>
                <div className="group relative p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 shadow-soft hover:shadow-2xl hover:shadow-indigo-500/10 cursor-default h-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div
                    className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
                    style={{ transform: "translateZ(40px)" }}
                  >
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
