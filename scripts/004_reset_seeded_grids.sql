-- Two independent cleanups, both consequences of bugs fixed in the app code.
-- Run each part separately in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Context
-- -------
-- PART 1 removes evaluation grids that were seeded with the STATIC criteria
-- (SCREENING_CRITERIA / TOPGRADING_EPISODES in lib/noa/interview-content.ts).
-- Those are frontend-developer criteria (React, TypeScript) that used to be
-- seeded for every candidate regardless of their campaign, so any candidate on
-- a non-frontend campaign was evaluated against a grid unrelated to the job —
-- producing "Non" across the board. The app now generates the criteria from the
-- campaign + candidate profile, but only when the grid row is FIRST created:
-- getOrCreateEvaluationGrid returns any existing row untouched. Deleting these
-- rows is what lets the app re-seed them properly.
--
-- PART 2 strips the pseudo-tags (`</advice>`) the model sometimes writes inside
-- the synthesis text itself. Already fixed at generation time (stripFieldTags in
-- lib/noa/ai.ts), but rows written before that fix still carry them.


-- ─── PART 1 · Reset grids seeded from the static criteria ──────────────────
--
-- DESTRUCTIVE: deleting a grid also deletes its `answers` and `notes`. For the
-- affected rows the answers are meaningless anyway (they grade the candidate on
-- someone else's criteria), but any interview already analysed will need its
-- transcript re-analysed to repopulate the grid and synthesis.
--
-- STEP 1a — PREVIEW FIRST. Run this on its own and read the result before
-- deleting anything. It lists exactly what the DELETE below would remove:
-- which candidate, which campaign, and whether answers would be lost.

select
  g.id                                as grid_id,
  c.first_name || ' ' || c.last_name  as candidat,
  i.type                              as etape,
  m.title                             as campagne,
  case when g.answers::text in ('{}', 'null') then 'non'
       else 'OUI — réponses perdues' end as perte_de_donnees,
  g.created_at
from evaluation_grids g
  join interviews i on i.id = g.interview_id
  join candidates  c on c.id = i.candidate_id
  left join missions m on m.id = g.mission_id
where
  -- Verbatim markers of the static seed. Generated criteria never reproduce
  -- these exact strings, so this targets seeded grids only.
  g.criteria::text like '%Expérience en développement React de niveau senior (> 3 ans)%'
  or g.criteria::text like '%Quelle est votre réalisation dont vous êtes le plus fier ?%'
order by g.created_at desc;

-- STEP 1b — Once the preview looks right, run the DELETE with the SAME `where`
-- clause. The app re-creates each grid, generated from its own campaign, the
-- next time the interview screen is opened.
--
-- Uncomment to run:
--
-- delete from evaluation_grids g
-- where
--   g.criteria::text like '%Expérience en développement React de niveau senior (> 3 ans)%'
--   or g.criteria::text like '%Quelle est votre réalisation dont vous êtes le plus fier ?%';


-- ─── PART 2 · Strip leaked field tags from stored syntheses ────────────────
--
-- Non-destructive: only removes the tags, leaves the surrounding text intact.
-- Mirrors FIELD_TAG in lib/noa/ai.ts. Narrow on purpose — a broader `<[^>]*>`
-- pattern would eat legitimate text such as "CA < 10M€" or "<5 ans".
--
-- STEP 2a — PREVIEW. Shows the affected rows and what they would become.

select
  s.id,
  s.advice                                                     as avant,
  trim(regexp_replace(s.advice, '</?(advice|content|synthese|synthesis)>', '', 'gi')) as apres
from syntheses s
where s.content ~* '</?(advice|content|synthese|synthesis)>'
   or s.advice  ~* '</?(advice|content|synthese|synthesis)>';

-- STEP 2b — Apply. Uncomment to run:
--
-- update syntheses s
-- set content = trim(regexp_replace(s.content, '</?(advice|content|synthese|synthesis)>', '', 'gi')),
--     advice  = trim(regexp_replace(s.advice,  '</?(advice|content|synthese|synthesis)>', '', 'gi'))
-- where s.content ~* '</?(advice|content|synthese|synthesis)>'
--    or s.advice  ~* '</?(advice|content|synthese|synthesis)>';
