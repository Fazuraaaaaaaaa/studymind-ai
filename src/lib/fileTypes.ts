/**
 * fileTypes.ts — Konstanta & util daftar tipe file (client-safe, tanpa dependensi Node).
 * Dipakai oleh komponen UI maupun server (lib/extract.ts).
 */

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILES = 5;

/** Gambar — dikirim ke Gemini sebagai inlineData (vision). */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp"];

/** Semua ekstensi yang diterima tombol upload. */
export const SUPPORTED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "odt",
  "odp",
  "ods",
  "rtf",
  "txt",
  "md",
  "csv",
  "html",
  "epub",
  ...IMAGE_EXTENSIONS,
];

/** Nilai untuk atribut `accept` pada <input type="file">. */
export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",");

/** Daftar singkat yang tampil di UI. */
export const SUPPORTED_FORMATS_LABEL =
  "PDF · Word (DOC/DOCX) · PowerPoint (PPT/PPTX) · Excel (XLS/XLSX) · ODT/ODP/ODS · RTF · TXT · MD · CSV · HTML · EPUB · PNG/JPG";

export function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isSupportedFile(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(getExtension(fileName));
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export type FileGroup = "pdf" | "word" | "slides" | "sheet" | "image" | "text" | "other";

export function getFileGroup(fileName: string): FileGroup {
  const ext = getExtension(fileName);
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf", "epub"].includes(ext)) return "word";
  if (["ppt", "pptx", "odp"].includes(ext)) return "slides";
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "sheet";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (["txt", "md", "html", "json", "yml", "yaml"].includes(ext)) return "text";
  return "other";
}

/** Warna badge kecil untuk menandai tipe file di daftar upload. */
export const FILE_GROUP_COLORS: Record<FileGroup, string> = {
  pdf: "bg-red-50 text-red-600 border-red-100",
  word: "bg-blue-50 text-blue-600 border-blue-100",
  slides: "bg-orange-50 text-orange-600 border-orange-100",
  sheet: "bg-emerald-50 text-emerald-600 border-emerald-100",
  image: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  text: "bg-slate-100 text-slate-600 border-slate-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};
