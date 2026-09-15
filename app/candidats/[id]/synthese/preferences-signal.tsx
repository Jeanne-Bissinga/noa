import Link from "next/link";
import { Card } from "@/components/noa/ui-primitives";
import type { PreferenceTopic } from "@/lib/noa/preferences/briefing";

// Mise en perspective des préférences, après l'entretien.
//
// ─── Ce que cette carte fait ────────────────────────────────────────────────
// Elle remontre, pour chaque compétence de la Scorecard concernée, l'hypothèse
// formulée AVANT l'entretien — et renvoie vers ce que l'entretien a
// effectivement établi. Le rapprochement est fait par le recruteur, pas par
// Noa.
//
// ─── Ce qu'elle ne fait pas ─────────────────────────────────────────────────
// Aucun score, aucun pourcentage, aucune section « Personnalité : 78/100 » ni
// « Compatibilité comportementale : 84 % ». Et aucune conclusion du type
// « l'hypothèse s'est confirmée » : Noa ne sait pas relier une phrase
// d'entretien à une hypothèse, et prétendre le contraire fabriquerait
// exactement la preuve qu'une préférence ne constitue pas.

export function PreferencesSignal({
  candidateId,
  firstName,
  topics,
}: {
  candidateId: string;
  firstName: string;
  topics: PreferenceTopic[];
}) {
  if (topics.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        Mise en perspective
      </p>
      <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
        Ce qui avait été formulé avant l&apos;entretien, à partir des préférences déclarées par{" "}
        {firstName}.
      </p>

      <div className="flex flex-col gap-4">
        {topics.map((topic) => (
          <div key={topic.skillId} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Attendu pour le poste
            </p>
            <p className="text-xs font-semibold text-[#010101]">{topic.skillName}</p>

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-1">
              Signal initial
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{topic.hypothesis}</p>

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-1">
              Éléments recueillis
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ce que l&apos;entretien a établi sur ce point figure dans la{" "}
              <Link
                href={`/candidats/${candidateId}/transcription?step=topgrading`}
                className="text-[#3a6fd4] underline hover:opacity-80"
              >
                grille remplie et la transcription
              </Link>
              .
            </p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
        Ce qui ressort de l&apos;entretien prime sur le signal initial. Une préférence déclarée
        n&apos;est pas une évaluation, et l&apos;évaluation reste celle de la synthèse ci-dessus.
      </p>
    </Card>
  );
}
