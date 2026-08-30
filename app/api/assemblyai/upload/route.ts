import "server-only";
import { NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";
import { ASSEMBLYAI_BASE_URL } from "@/lib/noa/assemblyai";

// Reçoit le blob audio enregistré côté navigateur, le transmet à AssemblyAI
// puis lance la transcription (langue française). Ne renvoie que l'id du
// job : le texte est récupéré par polling via /status/[id], pour ne pas
// bloquer la requête le temps que la transcription se termine (peut prendre
// plusieurs dizaines de secondes sur un entretien de topgrading).
export async function POST(request: Request) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription indisponible (clé AssemblyAI manquante)." }, { status: 500 });
  }

  const audio = await request.blob();
  if (audio.size === 0) {
    return NextResponse.json({ error: "Aucun audio reçu." }, { status: 400 });
  }

  const uploadRes = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/upload`, {
    method: "POST",
    headers: { authorization: apiKey },
    body: audio,
  });

  if (!uploadRes.ok) {
    return NextResponse.json({ error: "Échec de l'envoi de l'audio à AssemblyAI." }, { status: 502 });
  }

  const { upload_url } = await uploadRes.json();

  const transcriptRes = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
    method: "POST",
    headers: { authorization: apiKey, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: upload_url, language_code: "fr" }),
  });

  if (!transcriptRes.ok) {
    return NextResponse.json({ error: "Échec du lancement de la transcription." }, { status: 502 });
  }

  const { id } = await transcriptRes.json();
  return NextResponse.json({ transcriptId: id });
}
