"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getCandidate, getMission } from "@/lib/noa/queries";
import { STATUS_FIELDS, canMoveCandidate } from "@/lib/noa/labels";
import { extractCandidateProfile, CV_SUPPORTED_MIME, CV_DOCX_MIME, type CandidateProfileExtract } from "@/lib/noa/ai";
import type { CandidateStatus, DecisionStage } from "@/lib/noa/types";

// Un retour en arrière annule les étapes à partir de celle visée : leurs
// décisions ne tiennent plus. Sans ça, l'écran de décision afficherait
// "Décision déjà prise" et masquerait ses boutons, laissant le candidat
// bloqué — le kanban ne pouvant plus le faire avancer.
const STAGES_REOPENED_BY: Record<CandidateStatus, DecisionStage[]> = {
  Screening: ["screening", "topgrading", "final"],
  Topgrading: ["topgrading", "final"],
  "Decision finale": ["final"],
  // Issues terminales : jamais atteintes par un retour en arrière.
  "Non retenu": [],
  Recrute: [],
};

// ─── Kanban: move a candidate to a new column ──────────────────────────────
// Status-field mapping lives in lib/noa/labels.ts (STATUS_FIELDS) so it can be
// shared with the screening/topgrading/final decision Server Actions in
// app/candidats/[id]/actions.ts without violating the "use server" file's
// "only export async functions" rule.
//
// Le kanban ne sert qu'aux corrections : voir canMoveCandidate. Toute
// progression passe par decideStage / decideFinal, qui tracent la décision.
export async function moveCandidate(candidateId: string, newStatus: CandidateStatus) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }

  // Le board applique déjà la règle, mais il ne protège rien : la Server
  // Action est appelable directement.
  const check = canMoveCandidate(candidate.status, newStatus);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  if (candidate.status === newStatus) return;

  const supabase = await createClient();
  const fields = STATUS_FIELDS[newStatus];

  const { error } = await supabase
    .from("candidates")
    .update({
      status: newStatus,
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    throw new Error(error.message);
  }

  // Retour en arrière : les décisions des étapes réouvertes sont caduques.
  const reopened = STAGES_REOPENED_BY[newStatus];
  if (reopened.length) {
    await supabase.from("decisions").delete().eq("candidate_id", candidateId).in("stage", reopened);
  }

  revalidatePath("/candidats");
  revalidatePath(`/candidats/${candidateId}`);
  // Le dashboard compte les décisions en attente à partir de ces champs.
  revalidatePath("/dashboard");
  if (candidate.mission_id) {
    revalidatePath(`/missions/${candidate.mission_id}`);
  }
}

// ─── Extraction du CV à l'import (avant création de la fiche) ───────────────
// Appelée par le formulaire dès que le recruteur dépose un CV, pour préremplir
// l'identité du candidat. Le profil renvoyé est ensuite resoumis avec le
// formulaire (champ profile), ce qui évite de repayer l'extraction à la
// création. createCandidate sait toujours extraire lui-même en repli.
const CV_MAX_BYTES = 10 * 1024 * 1024;

// Un CV illisible est refusé, pas dégradé : le profil extrait alimente aussi la
// grille de screening et le guide d'entretien, donc une fiche sans extraction
// appauvrirait tout le parcours sans que personne ne sache pourquoi. Le message
// dit quoi faire (convertir), puisque la saisie manuelle n'est plus une issue.
const CV_FORMAT_ERROR =
  "noa ne sait pas lire ce format. Réenregistrez le CV en PDF ou .docx (ou importez-en une image) pour continuer.";

// Extensions de repli : tous les navigateurs n'annoncent pas un type fiable
// (un .docx arrive parfois en application/octet-stream, ou sans type du tout).
// Depuis qu'un format illisible est refusé, s'en tenir au type déclaré ferait
// rejeter de vrais CV — on retombe donc sur l'extension.
const CV_MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: CV_DOCX_MIME,
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * Type MIME lisible par noa pour ce fichier, ou null s'il n'y en a pas.
 * Sert à la fois de garde-fou et de type envoyé à Claude : un octet-stream
 * transmis tel quel ferait échouer l'extraction.
 */
function resolveCvMime(file: File): string | null {
  if (CV_SUPPORTED_MIME.test(file.type)) return file.type;
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  // Un .doc n'est dans aucune table : il reste refusé, quoi qu'annonce le
  // navigateur. Si l'extension ment sur le contenu, l'extraction lèvera.
  return (ext && CV_MIME_BY_EXT[ext]) || null;
}

// Le profil transite par le formulaire : on ne fait confiance à rien de sa
// forme. Tout champ absent ou du mauvais type retombe sur une valeur vide,
// et un JSON illisible annule le repli côté serveur plutôt que de le casser.
function parseProfileField(raw: FormDataEntryValue | null): CandidateProfileExtract | null {
  if (typeof raw !== "string" || !raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const p = parsed as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const strList = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

  const profile: CandidateProfileExtract = {
    firstName: str(p.firstName),
    lastName: str(p.lastName),
    title: str(p.title),
    location: str(p.location),
    email: str(p.email),
    summary: str(p.summary),
    experiences: (Array.isArray(p.experiences) ? p.experiences : []).map((raw) => {
      const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      return { role: str(e.role), company: str(e.company), period: str(e.period), bullets: strList(e.bullets) };
    }),
    skills: strList(p.skills),
  };

  // Un profil vide (objet mal formé, extraction sans résultat) doit valoir
  // "pas de profil" : sinon il court-circuiterait l'extraction de repli et la
  // fiche serait créée sans enrichissement, en silence.
  const empty =
    !profile.firstName && !profile.lastName && !profile.title && !profile.location &&
    !profile.email && !profile.summary && !profile.experiences.length && !profile.skills.length;

  return empty ? null : profile;
}

// rejected distingue les deux échecs, qui n'appellent pas la même suite :
// - rejected: le fichier n'entrera jamais en base (format, taille). Le
//   formulaire doit le refuser tout de suite, sinon le recruteur saisirait son
//   candidat pour se le voir refuser à la création.
// - sinon: le CV est valide mais l'extraction a échoué (fichier abîmé, API
//   indisponible). La fiche reste créable, à la main.
export type ExtractCvState =
  | { profile: CandidateProfileExtract }
  | { error: string; rejected?: boolean };

export async function extractCvProfile(formData: FormData): Promise<ExtractCvState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  const cvFile = formData.get("cvFile") as File | null;
  if (!cvFile || cvFile.size === 0) {
    return { error: "Aucun CV à analyser." };
  }

  if (cvFile.size > CV_MAX_BYTES) {
    return { error: "Le CV dépasse 10 Mo.", rejected: true };
  }

  // Seul le .doc binaire (Word 97-2003) tombe encore ici : PDF, images et .docx
  // sont tous lus. createCandidate refusera ce fichier de toute façon — autant
  // le dire maintenant, avant que le recruteur ne saisisse quoi que ce soit.
  const mediaType = resolveCvMime(cvFile);
  if (!mediaType) {
    return { error: CV_FORMAT_ERROR, rejected: true };
  }

  try {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const profile = await extractCandidateProfile({
      base64: buffer.toString("base64"),
      mediaType,
    });
    return { profile };
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Extraction du CV échouée à l'import : ${err?.message ?? String(e)}`);
    return { error: "noa n'a pas réussi à lire ce CV. Complétez la fiche à la main." };
  }
}

// ─── Create candidate ───────────────────────────────────────────────────────
export type CreateCandidateState = {
  error?: string;
};

export async function createCandidate(
  missionId: string | undefined,
  _prevState: CreateCandidateState,
  formData: FormData,
): Promise<CreateCandidateState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  if (!missionId) {
    return { error: "Aucune mission associée : impossible de créer la fiche candidat. Revenez à la mission concernée pour ajouter un candidat." };
  }

  const mission = await getMission(missionId);
  if (!mission || mission.company_id !== recruiter.company_id) {
    return { error: "Mission introuvable pour ce candidat." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const cvFile = formData.get("cvFile") as File | null;

  if (!firstName || !lastName) {
    return { error: "Merci de renseigner le prénom et le nom du candidat." };
  }

  if (!cvFile || cvFile.size === 0) {
    return { error: "Merci d'importer le CV du candidat." };
  }

  if (cvFile.size > CV_MAX_BYTES) {
    return { error: "Le CV dépasse 10 Mo." };
  }

  // Garde-fou de format : le formulaire filtre déjà (accept + refus à l'import),
  // mais l'accept n'est qu'une suggestion et la Server Action est appelable
  // directement. On refuse avant l'upload : rien d'illisible n'entre en base.
  const mediaType = resolveCvMime(cvFile);
  if (!mediaType) {
    return { error: CV_FORMAT_ERROR };
  }

  const supabase = await createClient();

  // Lecture unique du fichier : sert à l'upload ET à l'extraction noa.
  const buffer = Buffer.from(await cvFile.arrayBuffer());

  const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${recruiter.company_id}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("cv-attachments")
    .upload(path, buffer, { contentType: mediaType });

  if (uploadError) {
    return { error: `Échec de l'import du CV : ${uploadError.message}` };
  }

  // noa extrait le profil (titre, localisation, expériences, compétences…) du CV.
  // Le formulaire l'a normalement déjà fait à l'import et le resoumet ici : on
  // réutilise ce profil plutôt que de relancer une extraction. Repli sur une
  // extraction serveur si le champ est absent (échec côté client, JS désactivé).
  // Le format est déjà garanti lisible ci-dessus ; si l'extraction échoue quand
  // même (fichier abîmé, API indisponible), la fiche est créée sans profil.
  let profile = parseProfileField(formData.get("profile"));
  if (!profile) {
    try {
      profile = await extractCandidateProfile({ base64: buffer.toString("base64"), mediaType });
    } catch (e) {
      const err = e as { message?: string };
      console.error(`[noa] Extraction du CV échouée, fiche créée sans enrichissement : ${err?.message ?? String(e)}`);
    }
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      company_id: recruiter.company_id,
      mission_id: mission.id,
      first_name: firstName,
      last_name: lastName,
      cv_url: path,
      // Les champs sont préremplis par noa à l'import : ce que le recruteur a
      // sous les yeux fait foi. S'il corrige une valeur extraite, sa correction
      // gagne — le profil ne sert plus que de repli.
      title: title || profile?.title || null,
      location: location || profile?.location || null,
      email: profile?.email || null,
      summary: profile?.summary || null,
      status: "Screening",
      screening_status: "current",
      topgrading_status: "pending",
      decision_status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la fiche candidat." };
  }

  // Expériences et compétences extraites (tables dédiées).
  if (profile) {
    const experiences = profile.experiences.filter((exp) => exp.role || exp.company || exp.bullets.length);
    if (experiences.length) {
      await supabase.from("candidate_experiences").insert(
        experiences.map((exp, i) => ({
          candidate_id: data.id,
          role: exp.role || null,
          company: exp.company || null,
          period: exp.period || null,
          bullets: exp.bullets ?? [],
          position: i,
        })),
      );
    }

    const skills = [...new Set(profile.skills.map((s) => s.trim()).filter(Boolean))];
    if (skills.length) {
      await supabase.from("candidate_skills").insert(skills.map((name) => ({ candidate_id: data.id, name })));
    }
  }

  revalidatePath("/candidats");
  revalidatePath(`/missions/${mission.id}`);
  revalidatePath("/dashboard");
  redirect(`/candidats/${data.id}/transition?type=screening`);
}
