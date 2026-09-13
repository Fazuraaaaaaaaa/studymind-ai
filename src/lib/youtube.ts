/**
 * youtube.ts — Mengambil transkrip/subtitle video YouTube di sisi server.
 *
 * Strategi bertingkat:
 *  1. InnerTube /player (ANDROID & IOS client) -> ambil captionTracks lalu unduh timedtext.
 *  2. Library `youtube-transcript` (fallback).
 * Jika semuanya gagal, pemanggil dapat memakai jalur Gemini native video (lihat
 * `buildGeminiYouTubePart`) karena server Google yang mengambil videonya.
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
  readonly reason?: "no_subtitles" | "bot_check" | "unavailable" | "invalid_link";
  constructor(message: string, hint?: string, reason?: YouTubeError["reason"]) {
    super(message);
    this.name = "YouTubeError";
    this.hint = hint;
    this.reason = reason;
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

const INNER_TUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

interface ClientProfile {
  clientName: string;
  clientVersion: string;
  userAgent: string;
  extraClient: Record<string, unknown>;
  headers: Record<string, string>;
}

/**
 * YouTube memblokir request dari IP datacenter ("Sign in to confirm you're not a
 * bot"). Menyamar sebagai aplikasi resmi (Android/iOS) dengan client context
 * lengkap + header X-YouTube-Client-* terbukti jauh lebih jarang kena bot-check
 * daripada scraping halaman watch.
 */
const CLIENT_PROFILES: ClientProfile[] = [
  {
    clientName: "ANDROID",
    clientVersion: "20.10.38",
    userAgent: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
    extraClient: { androidSdkVersion: 34, hl: "id", gl: "ID", utcOffsetMinutes: 420 },
    headers: { "X-YouTube-Client-Name": "3", "X-YouTube-Client-Version": "20.10.38" },
  },
  {
    clientName: "IOS",
    clientVersion: "19.45.4",
    userAgent: "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en)",
    extraClient: { deviceModel: "iPhone16,2", deviceMake: "Apple", osName: "iPhone", osVersion: "17.5.1", hl: "id", gl: "ID" },
    headers: { "X-YouTube-Client-Name": "5", "X-YouTube-Client-Version": "19.45.4" },
  },
];

async function requestPlayer(videoId: string, profile: ClientProfile, timeoutMs: number): Promise<any | null> {
  const res = await fetch(INNER_TUBE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": profile.userAgent,
      "Accept-Encoding": "gzip, deflate",
      ...profile.headers,
    },
    body: JSON.stringify({
      context: {
        client: { clientName: profile.clientName, clientVersion: profile.clientVersion, ...profile.extraClient },
        user: { lockedSafetyMode: false },
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
      playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS", signatureTimestamp: 19800 } },
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function decodeEntities(input: string): string {
  return input.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseSrv1(xml: string): TranscriptResponse[] {
  const segments: TranscriptResponse[] = [];
  const re = /<text[^>]*?start="([\d.]+)"(?:[^>]*?dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const offset = Math.round(parseFloat(match[1] || "0") * 1000);
    const duration = Math.round(parseFloat(match[2] || "0") * 1000);
    const text = decodeEntities(match[3] || "").replace(/\s+/g, " ").trim();
    if (text) segments.push({ text, offset, duration });
  }
  return segments;
}

function parseJson3(raw: string): TranscriptResponse[] {
  let json: any;
  try { json = JSON.parse(raw); } catch { return []; }
  const events: any[] = json?.events || [];
  return events
    .filter((e) => Array.isArray(e.segs) && e.segs.length > 0)
    .map((e) => ({
      text: e.segs.map((s: any) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim(),
      offset: Number(e.tStartMs) || 0,
      duration: Number(e.dDurationMs) || 0,
    }))
    .filter((s) => s.text.length > 0);
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pickTrack(tracks: any[]): any | null {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const manual = tracks.filter((t) => t?.kind !== "asr");
  const pool = manual.length > 0 ? manual : tracks;
  return (
    pool.find((t) => t?.languageCode === "id") ||
    pool.find((t) => t?.languageCode === "en") ||
    pool.find((t) => typeof t?.languageCode === "string" && t.languageCode.startsWith("id")) ||
    pool[0] ||
    null
  );
}

interface InnerTubeResult {
  segments: TranscriptResponse[];
  language: string;
}

async function fetchViaInnerTube(videoId: string): Promise<InnerTubeResult | null> {
  for (let pass = 0; pass < 2; pass++) {
    for (const profile of CLIENT_PROFILES) {
      try {
        const data = await requestPlayer(videoId, profile, pass === 0 ? 8000 : 12000);
        const playability = data?.playabilityStatus?.status;
        const reason = data?.playabilityStatus?.reason || "";
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!Array.isArray(tracks) || tracks.length === 0) {
          console.warn(`[youtube] InnerTube ${profile.clientName} pass${pass}: playability=${playability} ${reason}, tracks=0`);
          continue;
        }

        const track = pickTrack(tracks);
        if (!track?.baseUrl) continue;

        const url = new URL(track.baseUrl);
        url.searchParams.set("fmt", "srv1");
        const subRes = await fetch(url.toString(), {
          headers: { "User-Agent": profile.userAgent },
          signal: AbortSignal.timeout(15000),
          cache: "no-store",
        });

        let segments: TranscriptResponse[] = [];
        if (subRes.ok) segments = parseSrv1(await subRes.text());

        if (segments.length === 0) {
          const jsonUrl = new URL(track.baseUrl);
          jsonUrl.searchParams.set("fmt", "json3");
          const jsonRes = await fetch(jsonUrl.toString(), {
            headers: { "User-Agent": profile.userAgent },
            signal: AbortSignal.timeout(20000),
            cache: "no-store",
          });
          if (jsonRes.ok) segments = parseJson3(await jsonRes.text());
        }

        if (segments.length > 0) {
          console.log(`[youtube] InnerTube OK via ${profile.clientName} (${segments.length} segmen, lang=${track.languageCode})`);
          return { segments, language: track.languageCode || "unknown" };
        }
      } catch (err) {
        console.warn(`[youtube] InnerTube ${profile.clientName} pass${pass} failed:`, (err as Error)?.message);
      }
    }
    if (pass === 0) await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}

function formatTranscript(segments: TranscriptResponse[], startSeconds: number | null): string {
  const cleaned = segments
    .map((s) => ({
      offset: s.offset ?? 0,
      text: (s.text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    }))
    .filter((s) => s.text.length > 0)
    .sort((a, b) => a.offset - b.offset);

  let output = "";
  for (const s of cleaned) {
    if (startSeconds && s.offset < startSeconds * 1000) continue;
    output += `[${formatTimestamp(s.offset)}] ${s.text}\n`;
  }
  return output.trim();
}

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
  if (!videoId) throw new YouTubeError("Link YouTube tidak valid.", undefined, "invalid_link");
  
  const startSeconds = extractStartSeconds(input);
  let segments: TranscriptResponse[] | null = null;
  let language = "unknown";
  let lastError: unknown = null;

  try {
    const innerTubeRes = await fetchViaInnerTube(videoId);
    if (innerTubeRes) {
      segments = innerTubeRes.segments;
      language = innerTubeRes.language;
    } else {
      console.log(`[YouTube] InnerTube proxy returned null for ${videoId}`);
    }
  } catch (e) {
    console.error(`[YouTube] InnerTube proxy error for ${videoId}:`, e);
  }

  if (!segments) {
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
  }

  if (!segments) {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
      language = "original";
    } catch (err) { lastError = err; }
  }

  if (!segments || segments.length === 0) {
    // throw Error with empty text fallback indicator
    throw new YouTubeError(
      `Video tidak bisa diambil subtitle-nya secara otomatis.`,
      "Pastikan video publik, tidak dibatasi usia, dan memiliki subtitle/CC. Sistem akan mencoba alternatif lain (AI Vision).",
      "no_subtitles"
    );
  }

  const text = formatTranscript(segments, startSeconds);
  if (text.trim().length < 40) {
    throw new YouTubeError(
      "Subtitle video ini terlalu singkat/kosong sehingga materinya tidak bisa dianalisis.",
      undefined,
      "no_subtitles"
    );
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

