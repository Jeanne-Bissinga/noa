"use client";

import { useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "uploading" | "transcribing" | "error";

const PREFERRED_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType() {
  return PREFERRED_MIME_TYPES.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
}

// Enregistre l'entretien depuis le micro (haut-parleur activé côté
// recruteur : capte les deux voix, à distance comme en présentiel), puis
// l'envoie à AssemblyAI pour transcription. Le texte renvoyé est fourni tel
// quel à l'appelant, qui l'insère dans le champ transcription existant — le
// recruteur peut toujours le corriger à la main ensuite.
export function useInterviewRecorder(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      setStatus("recording");
    } catch {
      setError("Impossible d'accéder au micro. Vérifiez les autorisations du navigateur.");
      setStatus("error");
    }
  };

  const pollTranscript = (transcriptId: string) => {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/assemblyai/status/${transcriptId}`);
        const data = await res.json();

        if (!res.ok || data.status === "error") {
          setError(data.error ?? "La transcription a échoué.");
          setStatus("error");
          return;
        }
        if (data.status === "completed") {
          onTranscript(data.text ?? "");
          setStatus("idle");
          return;
        }
        pollTranscript(transcriptId);
      } catch {
        setError("Connexion perdue pendant la transcription.");
        setStatus("error");
      }
    }, 3000);
  };

  const stop = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      cleanupStream();
      setStatus("uploading");
      try {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const res = await fetch("/api/assemblyai/upload", { method: "POST", body: blob });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Échec de l'envoi de l'enregistrement.");
          setStatus("error");
          return;
        }

        setStatus("transcribing");
        pollTranscript(data.transcriptId);
      } catch {
        setError("Échec de l'envoi de l'enregistrement.");
        setStatus("error");
      }
    };
    recorder.stop();
  };

  const cancel = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    mediaRecorderRef.current?.stop();
    cleanupStream();
    setStatus("idle");
    setError(null);
  };

  return { status, error, elapsedSeconds, start, stop, cancel };
}
