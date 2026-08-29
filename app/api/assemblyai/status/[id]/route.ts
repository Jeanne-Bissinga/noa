import "server-only";
import { NextResponse } from "next/server";
import { ASSEMBLYAI_BASE_URL } from "@/lib/noa/assemblyai";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription indisponible (clé AssemblyAI manquante)." }, { status: 500 });
  }

  const { id } = await params;

  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${id}`, {
    headers: { authorization: apiKey },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Échec de la récupération du statut de transcription." }, { status: 502 });
  }

  const data = await res.json();

  if (data.status === "error") {
    return NextResponse.json({ status: "error", error: data.error ?? "La transcription a échoué." });
  }

  return NextResponse.json({ status: data.status, text: data.status === "completed" ? data.text : null });
}
