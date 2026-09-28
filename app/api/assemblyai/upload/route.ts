import "server-only";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";
import { ASSEMBLYAI_BASE_URL } from "@/lib/noa/assemblyai";

// N'accepte plus le blob audio en direct (cf. /api/assemblyai/blob-upload) :
// le navigateur uploade l'audio vers Vercel Blob puis passe seulement son
// URL ici, pour éviter de faire transiter l'enregistrement complet d'un
// entretien long par une Vercel Function (limite de payload ~4.5 Mo, source
// d'une 413 sur les entretiens longs). Ne renvoie que l'id du job : le texte
// est récupéré par polling via /status/[id], pour ne pas bloquer la requête
// le temps que la transcription se termine (peut prendre plusieurs dizaines
// de secondes sur un entretien de topgrading).
export async function POST(request: Request) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Transcription indisponible (clé AssemblyAI manquante)." }, { status: 500 });
  }

  const { audioUrl } = await request.json();
  if (!audioUrl || !isOwnBlobUrl(audioUrl)) {
    return NextResponse.json({ error: "Aucun audio reçu." }, { status: 400 });
  }

  const transcriptRes = await fetch(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
    method: "POST",
    headers: { authorization: apiKey, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: audioUrl, language_code: "fr" }),
  });

  if (!transcriptRes.ok) {
    await del(audioUrl).catch(() => {});
    return NextResponse.json({ error: "Échec du lancement de la transcription." }, { status: 502 });
  }

  const { id } = await transcriptRes.json();
  return NextResponse.json({ transcriptId: id });
}

// Évite qu'un appelant fasse lancer une transcription sur une URL
// arbitraire : seules les URLs de notre propre store Vercel Blob sont
// acceptées.
function isOwnBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
