"use client"

import { motion } from "framer-motion"
import { TiltCard } from "@/components/ui/tilt-card"

export function TestimonialSection() {
  const testimonials = [
    {
      name: "M. Raditya Fernando",
      role: "Mahasiswa Teknik",
      text: "FazuraEdu sangat amat membantu saya ketika ingin mempelajari materi yang panjang. Hasil ringkasannya sangat tajam dan flashcard-nya bikin nagih!",
    },
    {
      name: "Janeeta Tajuzzaman",
      role: "Siswa SMA",
      text: "UI-nya bersih dan premium banget. Beda sama app AI lain yang berantakan. Bikin makin semangat belajar tiap malam.",
    },
    {
      name: "Khayla Putri",
      role: "Peserta Olimpiade",
      text: "Waktu mau OSN pusing hafalin biologi. Masukin PDF 100 halaman di sini langsung di-breakdown jadi kuis dan tutor yang bisa diajak diskusi 24 jam. Keren abis!",
    },
  ]

  return (
    <section id="testimoni" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            Dipercaya Pelajar Berprestasi
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Ribuan pelajar dari SMP hingga Universitas telah menggunakan FazuraEdu.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              key={idx}
              className="h-full"
            >
              <TiltCard depth={25} className="h-full">
                <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-soft flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-300 h-full relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <p className="text-sm font-medium text-slate-600 mb-8 leading-relaxed relative z-10">
                    "{t.text}"
                  </p>
                  <div
                    className="flex items-center gap-4 relative z-10"
                    style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-lg shadow-sm"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      {t.name[0]}
                    </div>
                    <div style={{ transform: "translateZ(10px)" }}>
                      <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                      <p className="text-xs font-bold text-indigo-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
