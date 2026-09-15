import { Card } from "@/components/noa/ui-primitives";
import {
  GUIDANCE_FOOTNOTE,
  guidanceSourceLine,
  type ConductAdviceItem,
} from "@/lib/noa/preferences/communication";
import type { PreferenceTopic } from "@/lib/noa/preferences/briefing";

// Ce que les préférences de travail apportent à la préparation de l'entretien.
//
// Deux sections, volontairement séparées, parce qu'elles n'ont pas le même
// statut :
//
//   « Pour votre échange » — comment conduire la conversation. Ne participe
//   jamais à l'évaluation. Déterministe, sans IA.
//
//   La prudence est dite UNE FOIS, au-dessus de la liste, et seulement pour un
//   test déclaré : les réponses au questionnaire Noa viennent de la personne,
//   il n'y a rien à relativiser. Les puces, elles, sont des consignes directes.
//   Chacune a porté un « Le résultat déclaré peut suggérer… » — répété d'une
//   puce à l'autre au point qu'on ne lisait plus que lui.
//
//   Le modèle est nommé, son résultat ne l'est jamais — ni « C/S », ni « INFJ ».
//
//   « Sujets à approfondir » — quoi vérifier, et seulement sur des compétences
//   réellement attendues pour le poste. Chaque sujet nomme la sienne.
//
// Ce qui n'est PAS affiché, et ne doit jamais l'être : les six dimensions, les
// moyennes, les écarts-types, un code DISC, un type MBTI, des niveaux Big Five.
// Un recruteur en entretien n'a rien à faire d'« Autonomie 1.8 » — il a besoin
// d'une question à poser.

const CATEGORY_LABEL: Record<string, string> = {
  technique: "technique",
  relationnelle: "relationnelle",
  comportementale: "comportementale",
};

export function PreferencesView({
  firstName,
  guidance,
  topics,
}: {
  firstName: string;
  guidance: ConductAdviceItem[];
  topics: PreferenceTopic[];
}) {
  // Tous les conseils d'une liste viennent de la même source : le contexte n'en
  // a qu'une. La lire sur le premier suffit.
  const sourceNotice = guidance.length > 0 ? guidanceSourceLine(guidance[0].source) : null;

  return (
    <>
      {guidance.length > 0 && (
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Pour votre échange avec {firstName}
          </p>
          {sourceNotice && (
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{sourceNotice}</p>
          )}
          <ul className="flex flex-col gap-2">
            {guidance.map((item) => (
              <li key={item.id} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{item.action}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">{GUIDANCE_FOOTNOTE}</p>
        </Card>
      )}

      {topics.length > 0 && (
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Sujets à approfondir
          </p>

          <div className="flex flex-col gap-4">
            {topics.map((topic) => (
              <div key={topic.skillId} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-bold text-[#010101]">Sujet à approfondir · {topic.skillName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Attendu pour le poste · compétence {CATEGORY_LABEL[topic.skillCategory] ?? topic.skillCategory}
                </p>

                <p className="text-xs text-gray-600 leading-relaxed mt-2.5">{topic.hypothesis}</p>
                <p className="text-xs text-gray-600 leading-relaxed mt-1.5">{topic.rationale}</p>

                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3.5 mb-1">
                  Question suggérée
                </p>
                <p className="text-xs text-[#010101] leading-relaxed">{topic.question}</p>

                <p className="text-[11px] text-gray-400 mt-2.5">À vérifier par un exemple concret.</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Proposition d&apos;approfondissement générée par IA à partir des préférences déclarées et
            des compétences attendues. Une préférence n&apos;est pas une preuve : seule la réponse
            de {firstName} compte.
          </p>
        </Card>
      )}

      {/* Dit une fois pour tout le bloc, et seulement ici : c'est le seul écran
          où le recruteur peut encore agir. Pendant l'entretien, Noa n'affiche
          que la grille et le guide — délibérément, pour qu'aucune lecture de
          préférences ne reste sous les yeux au moment d'évaluer. La
          contrepartie est qu'une question suggérée qui n'a pas été recopiée
          dans le guide ne sera plus là quand il faudra la poser. */}
      {(guidance.length > 0 || topics.length > 0) && (
        <p className="text-[11px] text-gray-400 leading-relaxed -mt-1 mb-4 px-1">
          Ces éléments ne s&apos;affichent pas pendant l&apos;entretien. Recopiez dans le guide
          d&apos;entretien ci-dessous ce que vous voulez garder sous les yeux.
        </p>
      )}
    </>
  );
}
