// Phase d'un écran d'entretien d'intégration.
//
// Une seule décision, prise à un seul endroit. Deux signaux — l'existence du
// guide et le statut de l'entretien — pour trois états, c'est exactement la
// configuration qui produit des écrans en désaccord quand chacun les combine
// à sa façon.
import type { Interview } from "@/lib/noa/types";

export type InterviewPhase = "preparation" | "conduite" | "restitution";

/**
 * `termine` prime sur l'absence de guide : un entretien mené se relit, même si
 * son guide venait à disparaître. L'inverse — un guide sans entretien terminé —
 * est la conduite en cours.
 */
export function interviewPhaseOf(
  interview: Pick<Interview, "status"> | null,
  hasGuide: boolean,
): InterviewPhase {
  if (interview?.status === "termine") return "restitution";
  if (hasGuide) return "conduite";
  return "preparation";
}
