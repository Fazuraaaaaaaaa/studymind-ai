import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, contextContext } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const systemPrompt = `
You are an expert AI tutor named "Tutor FazuraEdu". 
You are answering a student's question based on the following study material context:
"${contextContext || 'No specific context provided. Answer generally.'}"

Rules:
1. Answer in friendly Indonesian.
2. Keep it concise, engaging, and easy to understand for students.
3. Use markdown for formatting.
    `;

    const response = await generateWithFallback({
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nStudent's question: " + message }] }
      ],
      config: {
        temperature: 0.7,
      },
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Gagal merespon. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
