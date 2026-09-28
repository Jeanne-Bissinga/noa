import "server-only";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";

// Génère le token permettant au navigateur d'uploader l'audio d'un
// entretien directement vers Vercel Blob, sans passer par une Vercel
// Function : un entretien long dépasse la limite de payload des Functions
// (~4.5 Mo) qui déclenchait une 413 quand l'audio transitait par le
// serveur. Le blob est supprimé juste après la transcription (cf.
// /api/assemblyai/status/[id]).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const recruiter = await getCurrentRecruiter();
        if (!recruiter) {
          throw new Error("Non authentifié.");
        }

        return {
          allowedContentTypes: ["audio/webm", "audio/mp4", "audio/ogg"],
          addRandomSuffix: true,
          maximumSizeInBytes: 500 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
