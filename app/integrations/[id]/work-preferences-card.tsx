import { Card } from "@/components/noa/ui-primitives";
import { formatDisc } from "@/lib/noa/onboarding/disc";
import { contextSourceLabel, type PreferenceContext } from "@/lib/noa/onboarding/personalization";
import { highlightPreferences } from "@/lib/noa/onboarding/work-preferences";
import { BIG_FIVE_LEVEL_LABEL, BIG_FIVE_TRAIT_LABEL, BIG_FIVE_TRAITS } from "@/lib/noa/onboarding/declared-tests";
import type { OnboardingWorkPreferences } from "@/lib/noa/types";

// Lecture des préférences de travail, une fois complétées.
//
// L'invitation n'est plus ici : elle vit dans la carte « Avant son arrivée » de
// la fiche, avec les deux autres préparatifs. Ce composant ne montre donc que
// le résultat — et jamais les scores numériques ni les 24 réponses, qui ne
// diraient rien d'actionnable au manager.

function Result({ context }: { context: PreferenceContext }) {
  switch (context.kind) {
    case "none":
      return null;

    case "noa": {
      const highlights = highlightPreferences(context.scores);
      return (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4 mb-2">
            Préférences principales
          </p>
          {highlights.length === 0 ? (
            <p className="text-xs text-gray-400">
              Aucune préférence nettement marquée : la personne s&apos;adapte à des contextes variés.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {highlights.map((h) => (
                <li key={h.dimension} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {h.label}
                </li>
              ))}
            </ul>
          )}
          {highlights.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4 mb-2">
                Suggestions pour l&apos;intégration
              </p>
              <ul className="flex flex-col gap-1.5">
                {highlights.map((h) => (
                  <li key={h.dimension} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {h.recommendation}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      );
    }

    case "disc":
      return (
        <p className="text-xs text-gray-600 mt-3">
          Profil déclaré :{" "}
          <span className="font-semibold text-[#010101]">{formatDisc(context.primary, context.secondary)}</span>
        </p>
      );

    case "mbti":
      return (
        <p className="text-xs text-gray-600 mt-3">
          Type déclaré : <span className="font-semibold text-[#010101]">{context.type}</span>
        </p>
      );

    case "big_five":
      return (
        <div className="flex flex-col gap-1 mt-3">
          {BIG_FIVE_TRAITS.map((trait) => (
            <div key={trait} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{BIG_FIVE_TRAIT_LABEL[trait]}</span>
              <span className="text-xs font-semibold text-[#010101]">
                {BIG_FIVE_LEVEL_LABEL[context.levels[trait]]}
              </span>
            </div>
          ))}
        </div>
      );
  }
}

export function WorkPreferencesResult({
  firstName,
  context,
  preferences,
}: {
  firstName: string;
  context: PreferenceContext;
  preferences: OnboardingWorkPreferences | null;
}) {
  // Un profil DISC saisi par un manager avant l'existence des préférences de
  // travail reste lisible, mais il n'a pas été déclaré par la personne : le
  // dire évite de lui prêter des mots qu'elle n'a pas écrits.
  const legacy = preferences?.status !== "completed";
  const source = legacy ? "Profil DISC renseigné par le manager" : contextSourceLabel(context);

  if (context.kind === "none") return null;

  return (
    <Card className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        Préférences de travail
      </p>
      {source && <p className="text-xs text-gray-400">Source : {source}</p>}
      <Result context={context} />
      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
        Ces préférences sont une hypothèse de départ. Ce qui ressort des entretiens avec{" "}
        {firstName} prime toujours, sans que ce profil soit modifié pour autant.
      </p>
    </Card>
  );
}
