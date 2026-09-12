"use client"

import { useState, useRef, DragEvent, ChangeEvent } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
  Sparkles,
  Loader2,
  FileText,
  UploadCloud,
  PlayCircle,
  CheckCircle2,
  BrainCircuit,
  Layers,
  MessageSquare,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { GenerationResult } from "@/types"
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  MAX_FILE_SIZE_MB,
  formatFileSize,
  getFileGroup,
  FILE_GROUP_COLORS,
} from "@/lib/fileTypes"

function FloatingDeck() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [16, -16]), { stiffness: 150, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-22, 22]), { stiffness: 150, damping: 18 })

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mx.set((e.clientX - rect.left) / rect.width)
        my.set((e.clientY - rect.top) / rect.height)
      }}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5) }}
      className="relative h-[420px] hidden lg:block select-none perspective-1200 w-full"
    >
      <motion.div style={{ rotateX, rotateY }} className="absolute inset-0 transform-style-3d">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateZ: -6 }}
          animate={{ opacity: 1, y: 0, rotateZ: -6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
          className="absolute left-0 top-10 w-64 rounded-3xl bg-card border border-border shadow-soft p-5"
        >
          <div className="flex items-center gap-3 mb-4" style={{ transform: "translateZ(20px)" }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-foreground">Ringkasan Materi</span>
          </div>
          <div className="space-y-3" style={{ transform: "translateZ(10px)" }}>
            <div className="h-2 rounded-full bg-slate-100 w-full" />
            <div className="h-2 rounded-full bg-slate-100 w-5/6" />
            <div className="h-2 rounded-full bg-indigo-100 w-4/6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateZ: 8 }}
          animate={{ opacity: 1, y: 0, rotateZ: 8 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translateZ(90px)", transformStyle: "preserve-3d" }}
          className="absolute right-0 top-32 w-72 rounded-3xl bg-card border border-border shadow-soft p-5"
        >
          <div className="flex items-center justify-between mb-4" style={{ transform: "translateZ(20px)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">Smart Flashcard</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">3 / 10</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-4 line-clamp-2 leading-relaxed" style={{ transform: "translateZ(30px)" }}>
            Sebutkan fungsi utama dari mitokondria pada sel hewan!
          </p>
          <div className="w-full py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs font-medium text-slate-400" style={{ transform: "translateZ(15px)" }}>
            Ketuk untuk melihat jawaban
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, rotateZ: -3 }}
          animate={{ opacity: 1, y: 0, rotateZ: -3 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translateZ(140px)", transformStyle: "preserve-3d" }}
          className="absolute left-10 bottom-6 w-64 rounded-3xl bg-slate-900 shadow-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4" style={{ transform: "translateZ(25px)" }}>
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Progress Belajar</span>
          </div>
          <div className="flex items-end gap-2 h-14" style={{ transform: "translateZ(15px)" }}>
            {[30, 45, 25, 60, 50, 75, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className={`w-4 rounded-md ${i === 6 ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export function HeroSection({
  onResult,
  isLoading,
  setIsLoading
}: {
  onResult: (res: GenerationResult) => void
  isLoading: boolean
  setIsLoading: (val: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<"text" | "file" | "youtube">("text")
  const [text, setText] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** Tambah file ke daftar (validasi ukuran, jumlah, dan duplikat). */
  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return
    const list = Array.from(incoming)
    if (list.length === 0) return

    setError(null)
    const merged = [...files]
    const seen = new Set(merged.map((f) => `${f.name}:${f.size}`))
    const rejected: string[] = []

    for (const f of list) {
      if (merged.length >= MAX_FILES) {
        rejected.push(`Maksimal ${MAX_FILES} file sekaligus.`)
        break
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        rejected.push(`"${f.name}" melebihi ${MAX_FILE_SIZE_MB} MB.`)
        continue
      }
      const key = `${f.name}:${f.size}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(f)
    }

    setFiles(merged)
    if (rejected.length > 0) setError(rejected.join(" "))
  }

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = "" // reset agar file yang sama bisa dipilih ulang
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (activeTab === "text" && text.trim().length < 30) return setError("Materi minimal 30 karakter.")
    if (activeTab === "file" && files.length === 0) return setError("Silakan pilih minimal satu file materi (PDF, Word, PPT, Excel, dll).")
    if (activeTab === "youtube" && !youtubeUrl.trim()) return setError("Masukkan URL video YouTube.")

    setIsLoading(true)
    try {
      const formData = new FormData()
      if (activeTab === "file") files.forEach((f) => formData.append("files", f))
      else if (activeTab === "youtube") formData.append("youtubeUrl", youtubeUrl)
      else formData.append("text", text)

      const res = await fetch("/api/generate", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses materi")
      onResult(data.data)
      setTimeout(() => document.getElementById("study-result")?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-24 lg:pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-100/50 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="text-center lg:text-left z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600">Platform Belajar Cerdas Terdepan</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15] mb-6">
            Belajar Lebih Cerdas, <br className="hidden sm:block" />
            <span className="text-indigo-600">Bukan Lebih Lama.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            FazuraEdu mengubah file materi (PDF, PPT, Word, Excel, Catatan), link YouTube, atau teks biasa menjadi ringkasan cerdas, flashcard interaktif, dan kuis pemahaman dalam hitungan detik.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-2 bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl shadow-indigo-900/5 max-w-xl mx-auto lg:mx-0">
            <div className="bg-white rounded-3xl p-5 border border-slate-100">
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50/80 rounded-2xl mb-5 border border-slate-100/50">
                {([
                  { id: "text", label: "Teks", icon: FileText },
                  { id: "file", label: "File", icon: UploadCloud },
                  { id: "youtube", label: "YouTube", icon: PlayCircle },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {activeTab === "text" && (
                  <Textarea placeholder="Tempel materi pelajaran di sini..." value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading} className="min-h-[140px] rounded-2xl resize-none text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 p-4" />
                )}
                {activeTab === "file" && (
                  <div className="space-y-3">
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 sm:p-8 transition cursor-pointer text-center ${
                        isDragging
                          ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-300"
                      }`}
                    >
                      <UploadCloud className={`h-8 w-8 mb-3 ${isDragging ? 'text-indigo-600' : 'text-indigo-500'}`} />
                      <span className="text-sm font-bold text-slate-700">
                        {files.length === 0 ? "Pilih atau Tarik File ke Sini" : "Tambah File Lain"}
                      </span>
                      <span className="text-xs font-medium text-slate-400 mt-1 max-w-[280px]">
                        Mendukung PDF, Word, PPT, Excel, TXT, Foto (Maks. {MAX_FILE_SIZE_MB}MB/file, hingga {MAX_FILES} file)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_ATTRIBUTE}
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                        disabled={isLoading}
                      />
                    </label>

                    {files.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                          <span>File terpilih ({files.length}/{MAX_FILES})</span>
                          <button
                            type="button"
                            onClick={() => setFiles([])}
                            className="text-xs text-rose-500 hover:underline font-semibold"
                          >
                            Hapus Semua
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {files.map((f, i) => {
                            const group = getFileGroup(f.name)
                            const badgeColor = FILE_GROUP_COLORS[group]
                            return (
                              <div
                                key={`${f.name}-${i}`}
                                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 hover:bg-white transition"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase border ${badgeColor}`}>
                                    {group.toUpperCase()}
                                  </span>
                                  <span className="truncate font-semibold text-slate-800" title={f.name}>
                                    {f.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 shrink-0">
                                    ({formatFileSize(f.size)})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile(i)
                                  }}
                                  disabled={isLoading}
                                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition shrink-0"
                                  title="Hapus file ini"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "youtube" && (
                  <Input placeholder="Link Video YouTube..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} disabled={isLoading} className="h-14 rounded-2xl text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 px-4" />
                )}

                {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2"><span>⚠️</span><span>{error}</span></div>}

                <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses dengan AI...</> : "Mulai Belajar Sekarang"}
                </Button>
              </form>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-medium text-slate-500">
            {["100% Gratis", "Bahasa Indonesia", "Hasil Instan"].map((t) => (
              <div key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{t}</div>
            ))}
          </motion.div>
        </div>

        <FloatingDeck />
      </div>
    </section>
  )
}
