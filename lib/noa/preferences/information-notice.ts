// Ce que le candidat lit avant la première question.
//
// ─── Ce n'est pas un consentement ───────────────────────────────────────────
// Il n'y a pas de case à cocher, et il ne doit pas y en avoir : une case
// cochée ne constituerait pas à elle seule la base juridique du traitement, et
// la présenter comme telle serait faux. Ce que Noa fait ici est plus modeste et
// plus exact : informer clairement, puis noter quelle version du texte a été
// affichée et quand — de quoi redire, plus tard, ce qui a réellement été lu.
//
// Rien dans le produit ne dépend de cet horodatage : ni l'accès à la page, ni
// l'enregistrement des réponses, ni quoi que ce soit en aval.
//
// ─── Version ────────────────────────────────────────────────────────────────
// Toute modification de NOTICE_PARAGRAPHS impose de changer NOTICE_VERSION,
// sans quoi deux textes différents porteraient la même étiquette et la trace
// ne vaudrait plus rien. Un test de non-régression le vérifie.

export const NOTICE_VERSION = "2026-09-v1";

export const NOTICE_TITLE = "Pourquoi ces informations ?";

export const NOTICE_PARAGRAPHS: string[] = [
  "Vos réponses aident le recruteur à préparer les prochains échanges et à identifier certains sujets professionnels à approfondir.",
  "Elles ne déterminent pas automatiquement l'issue de votre candidature.",
  "Les éléments pertinents sont mis en perspective avec les compétences attendues pour le poste et les informations recueillies pendant les entretiens.",
];

/** Route existante, publique (cf. PUBLIC_PATHS dans lib/supabase/proxy.ts). */
export const PRIVACY_PATH = "/confidentialite";
