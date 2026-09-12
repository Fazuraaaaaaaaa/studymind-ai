/**
 * extract.ts — Ekstraksi teks universal untuk file materi belajar.
 *
 * Mendukung: PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx), Excel
 * (.xls/.xlsx), OpenDocument (.odt/.odp/.ods), RTF, CSV, HTML, Markdown,
 * EPUB, TXT, serta gambar (PNG/JPG/WebP/GIF/BMP) yang diteruskan ke Gemini
 * vision sebagai data inline.
 */

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILES = 5;

/** Perpanjangan yang dibaca sebagai teks murni. */
const PLAIN_TEXT_EXTENSIONS = ["txt", "json", "log", "yml", "yaml", "ini"];

/** Perpanjangan yang ditangani oleh officeparser. */
const OFFICE_PARSER_EXTENSIONS: Record<string, string> = {
  docx: "docx",
  pptx: "pptx",
  xlsx: "xlsx",
  odt: "odt",
  odp: "odp",
  ods: "ods",
  rtf: "rtf",
  csv: "csv",
  html: "html",
  htm: "html",
  md: "md",
  markdown: "md",
  epub: "epub",
};

/** Format Office lama (binary OLE) — best-effort extraction. */
const LEGACY_EXTENSIONS = ["doc", "ppt", "xls"];

/** Gambar — dikirim ke Gemini sebagai inlineData (vision). */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp"];

const IMAGE_MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
};

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

export type ExtractedImage = { mimeType: string; dataBase64: string };

export type ExtractedDocument = {
  name: string;
  extension: string;
  kind: "text" | "image";
  text: string;
  image: ExtractedImage | null;
  warning?: string;
};

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

/** Bersih-bersih teks hasil ekstraksi agar rapi saat dikirim ke AI. */
function sanitizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[\u{FEFF}\u200B-\u200D\u2028\u2029]/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Ekstraksi best-effort dari file biner OLE lama (.ppt/.xls) dengan mengambil
 * deretan karakter yang masih bisa dibaca (UTF-16LE dan ASCII).
 */
function extractPrintableRuns(buffer: Buffer): string {
  const runs: string[] = [];
  const seen = new Set<string>();

  const push = (value: string, minimum: number) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean.length < minimum) return;
    if (!/[a-zA-Z\u00c0-\u024f]/.test(clean)) return;
    if (/^(Root Entry|Current User|SummaryInformation|DocumentSummaryInformation|PowerPoint|Microsoft|_rels|\[Content|KSOProduct)/i.test(clean)) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    runs.push(clean);
  };

  for (let offset = 0; offset < 2; offset++) {
    let current = "";
    for (let i = offset; i + 1 < buffer.length; i += 2) {
      const code = buffer.readUInt16LE(i);
      const printable =
        (code >= 0x20 && code <= 0x7e) || code === 0x0a || code === 0x0d || (code >= 0xc0 && code <= 0x24f);
      if (printable) current += String.fromCharCode(code);
      else {
        push(current, 6);
        current = "";
      }
    }
    push(current, 6);
  }

  let ascii = "";
  for (let i = 0; i < buffer.length; i++) {
    const code = buffer[i];
    if ((code >= 0x20 && code <= 0x7e) || code === 0x0a) ascii += String.fromCharCode(code);
    else {
      push(ascii, 8);
      ascii = "";
    }
  }
  push(ascii, 8);

  return runs.join("\n");
}

async function extractFromPdf(buffer: Buffer, name: string): Promise<ExtractedDocument> {
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const parsePdf = mod?.default ?? mod;
  const data = await parsePdf(buffer);
  const text = sanitizeText(String(data?.text ?? ""));

  if (text.length < 30) {
    return { name, extension: "pdf", kind: "text", text: "", image: null, warning: `PDF "${name}" terbaca tapi tidak ada teksnya.` };
  }
  return { name, extension: "pdf", kind: "text", text, image: null };
}

async function extractFromOfficeParser(buffer: Buffer, name: string, extension: string): Promise<ExtractedDocument> {
  const { parseOffice } = await import("officeparser");
  const fileType = OFFICE_PARSER_EXTENSIONS[extension];
  const result: any = await parseOffice(buffer, { fileType } as any);
  const text = sanitizeText(typeof result?.toText === "function" ? result.toText() : String(result?.text ?? ""));

  if (text.length < 30) {
    return { name, extension, kind: "text", text: "", image: null, warning: `Dokumen "${name}" tidak mengandung teks yang bisa dibaca.` };
  }
  return { name, extension, kind: "text", text, image: null };
}

async function extractFromLegacyDoc(buffer: Buffer, name: string): Promise<ExtractedDocument> {
  try {
    const mod: any = await import("word-extractor");
    const WordExtractor = mod?.default ?? mod;
    const doc = await new WordExtractor().extract(buffer);
    const text = sanitizeText([doc.getBody(), doc.getHeaders?.() ?? "", doc.getFootnotes?.() ?? ""].join("\n\n"));
    if (text.length >= 30) return { name, extension: "doc", kind: "text", text, image: null };
  } catch (error) {
    console.warn(`[extract] word-extractor gagal untuk "${name}", mencoba fallback biner.`, error);
  }
  const text = sanitizeText(extractPrintableRuns(buffer));
  return { name, extension: "doc", kind: "text", text, image: null, warning: text.length >= 30 ? `File lama diekstrak best-effort.` : `Gagal dibaca.` };
}

async function extractFromLegacySpreadsheetOrSlides(buffer: Buffer, name: string, extension: string): Promise<ExtractedDocument> {
  const text = sanitizeText(extractPrintableRuns(buffer));
  return { name, extension, kind: "text", text, image: null, warning: text.length >= 30 ? `File lama diekstrak best-effort.` : `Gagal dibaca.` };
}

function extractFromImage(file: File, buffer: Buffer, extension: string): ExtractedDocument {
  const mimeType = file.type && file.type.startsWith("image/") ? file.type : IMAGE_MIME_TYPES[extension] ?? "image/png";
  return { name: file.name, extension, kind: "image", text: "", image: { mimeType, dataBase64: buffer.toString("base64") } };
}

export async function extractDocument(file: File): Promise<ExtractedDocument> {
  const extension = getExtension(file.name);
  if (!extension) throw new Error(`File "${file.name}" tidak memiliki ekstensi.`);
  if (!isSupportedFile(file.name)) throw new Error(`Format .${extension} pada "${file.name}" belum didukung.`);
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) throw new Error(`Ukuran file "${file.name}" melebihi ${MAX_FILE_SIZE_MB} MB.`);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) throw new Error(`File "${file.name}" kosong.`);

  if (IMAGE_EXTENSIONS.includes(extension)) return extractFromImage(file, buffer, extension);
  if (extension === "pdf") return extractFromPdf(buffer, file.name);
  if (PLAIN_TEXT_EXTENSIONS.includes(extension)) return { name: file.name, extension, kind: "text", text: sanitizeText(buffer.toString("utf-8")), image: null };
  if (OFFICE_PARSER_EXTENSIONS[extension]) return extractFromOfficeParser(buffer, file.name, extension);
  if (extension === "doc") return extractFromLegacyDoc(buffer, file.name);
  if (LEGACY_EXTENSIONS.includes(extension)) return extractFromLegacySpreadsheetOrSlides(buffer, file.name, extension);

  throw new Error(`Format .${extension} pada "${file.name}" belum didukung.`);
}

export function combineDocuments(documents: ExtractedDocument[]): string {
  const withText = documents.filter((doc) => doc.kind === "text" && doc.text.length > 0);
  if (withText.length === 0) return "";
  if (withText.length === 1) return withText[0].text;
  return withText.map((doc, index) => `===== FILE ${index + 1}: ${doc.name} =====\n${doc.text}`).join("\n\n");
}
