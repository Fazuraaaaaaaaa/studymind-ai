/**
 * youtube.ts — Mengambil transkrip/subtitle video YouTube di sisi server.
 */
import {
  YoutubeTranscript,
  YoutubeTranscriptNotAvailableLanguageError,
  type TranscriptResponse,
} from "youtube-transcript";

const PREFERRED_LANGS = ["id", "en"];

export interface YouTubeTranscriptResult {
  videoId: string;
  url: string;
  title: string | null;
  text: string;
  language: string;
  rawLength: number;
  warning?: string;
}

export class YouTubeError extends Error {
  readonly hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "YouTubeError";
    this.hint = hint;
  }
}

export function extractVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  let url: URL;
  try { url = new URL(raw.startsWith("http") ? raw : `https://${raw}`); } catch { return null; }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const isYoutube = host.endsWith("youtube.com") || host === "youtu.be" || host.endsWith("youtube-nocookie.com");
  if (!isYoutube) return null;

  const pathSegments = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be" && pathSegments.length > 0) return pathSegments[0];

  const vParam = url.searchParams.get("v");
  if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

  const marker = ["embed", "shorts", "live", "v"].find((m) => pathSegments.includes(m));
  if (marker) {
    const idx = pathSegments.indexOf(marker);
    const candidate = pathSegments[idx + 1];
    if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
  }
  return null;
}

function extractStartSeconds(input: string): number | null {
  let url: URL;
  try { url = new URL(input.startsWith("http") ? input : `https://${input}`); } catch { return null; }
  const param = url.searchParams.get("t") || url.searchParams.get("start") || url.hash.replace(/^#t=/, "");
  if (!param) return null;
  const match = param.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  if (!h && !m && !s) return null;
  return Number(h || 0) * 3600 + Number(m || 0) * 60 + Number(s || 0);
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function formatTranscript(segments: TranscriptResponse[], startSeconds: number | null): string {
  const cleaned = segments.map((s) => ({
    offset: s.offset ?? 0,
    text: (s.text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
async function fetchVideoTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.title ? (data.author_name ? `${data.title} (Channel: ${data.author_name})` : data.title) : null;
  } catch { return null; }
}

export async function fetchYouTubeTranscript(input: string): Promise<YouTubeTranscriptResult> {
  const videoId = extractVideoId(input);
  if (!videoId) throw new YouTubeError("Link YouTube tidak valid.");
  
  const startSeconds = extractStartSeconds(input);
  let segments: TranscriptResponse[] | null = null;
  let language = "unknown";
  let lastError: unknown = null;

  for (const lang of PREFERRED_LANGS) {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      language = lang;
      break;
    } catch (err) {
      lastError = err;
      if (err instanceof YoutubeTranscriptNotAvailableLanguageError) continue;
      break;
    }
  }

  if (!segments) {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
      language = "original";
    } catch (err) { lastError = err; }
  }

  if (!segments) {
    throw new YouTubeError(`Video tidak bisa diambil subtitle-nya. Pastikan video publik dan memiliki subtitle/CC.`);
  }

  const text = formatTranscript(segments, startSeconds);
  if (text.trim().length < 40) {
    throw new YouTubeError("Subtitle video ini terlalu singkat/kosong sehingga materinya tidak bisa dianalisis.");
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: await fetchVideoTitle(videoId),
    text,
    language,
    rawLength: segments.reduce((acc, s) => acc + (s.text?.length ?? 0), 0)
  };
}

export function buildYouTubeMaterial(result: YouTubeTranscriptResult): string {
  return [
    "SUMBER MATERI: VIDEO YOUTUBE (transkrip asli subtitle)",
    result.title ? `Judul video: ${result.title}` : null,
    `Link: ${result.url}`,
    `Bahasa subtitle: ${result.language}`,
    "",
    "ATURAN WAJIB:",
    "- Jawab HANYA berdasarkan transkrip di bawah ini. DILARANG menambah fakta, contoh, atau istilah yang tidak ada di transkrip.",
    "- Jika suatu detail tidak disebutkan dalam transkrip, jangan mengarangnya.",
    "",
    "TRANSKRIP:",
    "---",
    result.text,
    "---"
  ].filter(Boolean).join("\n");
}

  })).filter((s) => s.text.length > 0 && !/^[\[({]*(♪|♫|\u33a1)[\])}\]]*$/i.test(s.text))
     .filter((s) => (startSeconds === null ? true : s.offset >= startSeconds * 1000));

  if (cleaned.length === 0) return "";
  const lines: string[] = [];
  let buffer: string[] = [];
  let bufferStart = cleaned[0].offset;

  for (const seg of cleaned) {
    if (buffer.length === 0) bufferStart = seg.offset;
    buffer.push(seg.text);
    const isSentenceEnd = /[.?!]$/.test(seg.text);
    const reachedChunk = seg.offset - bufferStart >= 25_000 || buffer.join(" ").length >= 400;
    if (isSentenceEnd && reachedChunk) {
      lines.push(`[${formatTimestamp(bufferStart)}] ${buffer.join(" ")}`);
      buffer = [];
    }
  }
  if (buffer.length > 0) lines.push(`[${formatTimestamp(bufferStart)}] ${buffer.join(" ")}`);
  return lines.join("\n\n");
}