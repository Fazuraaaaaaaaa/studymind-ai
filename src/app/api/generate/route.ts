import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini";
import {
  fetchYouTubeTranscript,
  buildYouTubeMaterial,
  extractVideoId,
  YouTubeError,
} from "@/lib/youtube";
import {
  extractDocument,
  combineDocuments,
  MAX_FILES,
  MAX_FILE_SIZE_MB,
  SUPPORTED_EXTENSIONS,
  type ExtractedDocument,
} from "@/lib/extract";

const SYSTEM_PROMPT = `
You are an expert AI educator and study assistant named FazuraEdu. Your goal is to analyze the provided educational material thoroughly and produce an exceptionally structured, comprehensive, and high-quality study guide in strict JSON format.

The JSON must exactly follow this schema:
{
  "summary": "A comprehensive, beautifully formatted Markdown summary in Indonesian. Use clear headings (##, ###), bullet points, bold key terms, concept explanations, and a '📌 Poin Kunci' / Key Takeaways section.",
  "flashcards": [
    {
      "question": "Clear and specific question based on key concepts in Indonesian",
      "answer": "Direct, clear, and informative answer in Indonesian"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "A multiple-choice question testing conceptual understanding in Indonesian",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation in Indonesian of why this option is correct and why the alternatives are incorrect"
    }
  ]
}

Instructions:
1. Output language MUST be natural, grammatically correct Indonesian.
2. Provide rich depth in the summary without unnecessary fluff.
3. Generate at least 5-8 flashcards and 5-8 quiz questions covering different parts of the material.
4. Return ONLY valid JSON, without any markdown code block wrappers (do not use \`\`\`json). The output must be directly parseable.
5. If multiple documents/files are uploaded, synthesize them into one cohesive study guide and reference the key topics from each source.
`;

const MAX_CONTENT_CHARS = 120_000;

// YouTube extraction + Gemini generation bisa memakan waktu >10 detik.
export const maxDuration = 60;

function collectFiles(formData: FormData): File[] {
  const multiple = formData.getAll("files").filter((v): v is File => v instanceof File);
  const single = formData.get("file");
  const legacy = single instanceof File ? [single] : [];
  const merged = [...multiple, ...legacy].filter((f) => f.size > 0);

  // Dedup berdasarkan nama + ukuran supaya tidak ada file kembar.
  const seen = new Set<string>();
  return merged.filter((f) => {
    const key = `${f.name}:${f.size}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const textInput = formData.get("text") as string | null;
    const youtubeUrl = formData.get("youtubeUrl") as string | null;
    const files = collectFiles(formData);

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} file dalam sekali upload.` },
        { status: 400 }
      );
    }

    const documents: ExtractedDocument[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Ukuran file "${file.name}" melebihi ${MAX_FILE_SIZE_MB} MB.` },
          { status: 400 }
        );
      }
      const doc = await extractDocument(file);
      if (doc.warning) warnings.push(doc.warning);
      documents.push(doc);
      console.info(`[generate] "${file.name}" (${doc.extension}) -> ${doc.kind === "image" ? "gambar" : `${doc.text.length} karakter`}`);
    }

    const extractedText = combineDocuments(documents);
    const images = documents.map((doc) => doc.image).filter((img): img is NonNullable<typeof img> => img !== null);

    let contentToAnalyze = "";
    let isYouTubeSource = false;
    let ytMode = "none";
    let youtubeFallbackUrl: string | null = null;

    if (youtubeUrl && youtubeUrl.trim().length > 0) {
      try {
        const yt = await fetchYouTubeTranscript(youtubeUrl);
        contentToAnalyze = buildYouTubeMaterial(yt);
        isYouTubeSource = true;
        ytMode = "subtitle";
        console.info(
          `[generate] youtube ${yt.videoId} -> subtitle "${yt.language}", ${yt.text.length} karakter, judul: ${yt.title ?? "(n/a)"}`
        );
      } catch (err: any) {
        const vid = extractVideoId(youtubeUrl);
        if (!vid) {
          return NextResponse.json(
            {
              error:
                err instanceof YouTubeError
                  ? `${err.message}${err.hint ? ` ${err.hint}` : ""}`
                  : `Gagal mengambil transkrip video YouTube: ${err?.message || "kesalahan tidak diketahui."}`,
            },
            { status: 400 }
          );
        }
        // Fallback: biarkan server Google yang "menonton" videonya langsung.
        console.warn(`[generate] YouTube transcript gagal untuk ${vid}, fallback ke Gemini native video. Reason:`, err?.message);
        youtubeFallbackUrl = `https://www.youtube.com/watch?v=${vid}`;
        isYouTubeSource = true;
        ytMode = "video";
      }
    } else if (extractedText.trim().length > 0) {
      contentToAnalyze = extractedText;
    } else if (textInput && textInput.trim().length > 0) {
      contentToAnalyze = textInput;
    }

    if (contentToAnalyze.length > MAX_CONTENT_CHARS) {
      contentToAnalyze = `${contentToAnalyze.slice(0, MAX_CONTENT_CHARS)}\n\n[Catatan: materi dipotong karena terlalu panjang.]`;
    }

    if (!youtubeFallbackUrl && contentToAnalyze.trim().length < 30 && images.length === 0) {
      const warningText = warnings.length ? ` ${warnings.join(" ")}` : "";
      return NextResponse.json(
        {
          error:
            warningText.trim() ||
            `Mohon sediakan materi minimal 30 karakter atau file yang valid (${SUPPORTED_EXTENSIONS.join(", ")}).`,
        },
        { status: 400 }
      );
    }

    const parts: any[] = [];
    const fileNames = files.map((f, i) => `${i + 1}. ${f.name}`).join("\n");

    let promptHeader = SYSTEM_PROMPT;
    if (files.length > 0) promptHeader += `\nDokumen yang diunggah:\n${fileNames}\n`;
    if (images.length > 0) promptHeader += `\nBeberapa materi dikirim sebagai gambar (catatan/foto slide). Baca isinya dan jadikan bagian dari materi.\n`;
    
    if (youtubeFallbackUrl) {
      promptHeader += `\nMateri ini berasal dari tautan video YouTube berikut. Tonton dan analisa materi video tersebut secara komprehensif, jangan berhalusinasi.\n`;
      parts.push({ text: promptHeader });
      parts.push({ fileData: { fileUri: youtubeFallbackUrl, mimeType: "video/mp4" } });
      if (images.length > 0) parts.push({ text: "Lanjut, berikut materi tambahan berupa gambar:" });
    } else {
      if (isYouTubeSource) promptHeader += `\nMateri di bawah adalah TRANSKRIP ASLI subtitle video YouTube. Gunakan HANYA informasi yang benar-benar terdapat pada transkrip tersebut. Jangan menambahkan pengetahuan umum, contoh, atau rumus yang tidak disebutkan.\n`;
      
      if (contentToAnalyze.trim().length > 0) {
        parts.push({ text: `${promptHeader}\n\nMaterial to analyze:\n${contentToAnalyze}` });
        if (images.length > 0) parts.push({ text: "Lanjut, berikut materi berupa gambar:" });
      } else {
        parts.push({ text: `${promptHeader}\n\nMaterial to analyze (hanya gambar):` });
      }
    }

    for (const image of images) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.dataBase64 } });
    }

    const response = await generateWithFallback({
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    // Safely parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      parsedData = JSON.parse(cleanJson);
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      meta: { files: documents.map((d) => ({ name: d.name, type: d.extension, kind: d.kind })), warnings },
    });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    
    let message = error?.message || "Gagal membuat materi belajar. Silakan coba lagi.";
    
    if (error?.message?.includes("OfficeParser")) {
      message = `File gagal dibaca. Pastikan formatnya didukung (${SUPPORTED_EXTENSIONS.join(", ")}).`;
    } else if (error?.status === 403 || error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("403")) {
      message = `Video YouTube ini privat, dibatasi usia, atau tidak mengizinkan akses. Gunakan video YouTube lain yang bersifat publik.`;
    } else if (error?.status === 404 || error?.message?.includes("NOT_FOUND")) {
      message = `Video YouTube tidak ditemukan atau dihapus.`;
    } else if (error?.status === 503 || error?.message?.includes("UNAVAILABLE")) {
      message = `Server AI sedang sangat sibuk memproses video. Silakan coba lagi dalam beberapa menit.`;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

