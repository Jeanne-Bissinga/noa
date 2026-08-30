import "server-only";

// Région AssemblyAI utilisée pour la transcription des entretiens.
//
// Par défaut l'endpoint européen : les enregistrements audio des candidats sont
// alors traités et stockés dans l'Union européenne, et ne sont pas utilisés
// pour entraîner les modèles du prestataire, contrairement au régime par
// défaut de l'endpoint global (États-Unis). Cf. la politique de
// confidentialité, article 7.
//
// La clé d'API fonctionne sur les deux régions : c'est l'URL appelée qui
// détermine où atterrissent les données. ASSEMBLYAI_API_BASE_URL permet de
// revenir à l'endpoint global sans redéploiement si nécessaire.
export const ASSEMBLYAI_BASE_URL =
  process.env.ASSEMBLYAI_API_BASE_URL || "https://api.eu.assemblyai.com";
