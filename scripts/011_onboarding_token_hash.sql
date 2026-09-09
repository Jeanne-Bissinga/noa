-- Les liens de point de suivi ne sont plus stockés en clair.
--
-- scripts/010_onboarding.sql conservait le token brut en base pour que le
-- manager puisse réafficher le lien. C'était le mauvais compromis : un accès
-- en lecture à cette table (fuite de sauvegarde, requête mal cadrée, erreur de
-- policy) donnait directement accès aux questionnaires de tous les
-- collaborateurs. On ne stocke désormais que l'empreinte SHA-256 du token.
--
-- Conséquence assumée : Noa ne peut plus réafficher un lien déjà émis, puisque
-- le token brut n'existe plus nulle part. Le manager dispose à la place d'une
-- action « Régénérer le lien », qui invalide le précédent et en émet un
-- nouveau (cf. app/candidats/[id]/integration/actions.ts).
--
-- SHA-256 sans sel ni dérivation lente est le bon choix ici, contrairement à
-- un mot de passe : le token fait 256 bits d'aléa cryptographique, il n'est ni
-- devinable ni attaquable par dictionnaire. La lenteur ne protégerait rien et
-- coûterait à chaque ouverture de lien.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

-- ─── token -> token_hash ────────────────────────────────────────────────────
-- Nullable : un point de suivi existe dès la validation du plan, mais son lien
-- n'est émis qu'au moment où le manager le transmet. Tant qu'aucun lien n'a
-- été émis, il n'y a rien à hacher — et rien à faire expirer.
alter table onboarding_check_ins
  add column if not exists token_hash text;

alter table onboarding_check_ins
  alter column token_expires_at drop not null;

-- Les liens déjà émis sous 010 deviennent invalides : leur token brut n'a pas
-- d'équivalent haché récupérable, et le conserver irait contre l'objet même de
-- cette migration. Les points de suivi, eux, restent intacts — seul le lien est
-- à réémettre depuis Noa.
alter table onboarding_check_ins
  drop column if exists token;

drop index if exists onboarding_check_ins_token_idx;

-- Unique : deux points de suivi ne peuvent pas partager une empreinte (ce
-- serait une collision SHA-256, mais l'index est aussi ce qui rend la
-- résolution d'un lien indexée plutôt que séquentielle).
create unique index if not exists onboarding_check_ins_token_hash_idx
  on onboarding_check_ins(token_hash)
  where token_hash is not null;

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- Le retour en arrière ne peut pas restaurer les tokens : il rend seulement la
-- colonne au schéma de 010. Tous les liens sont alors à réémettre.
--
-- alter table onboarding_check_ins add column if not exists token text;
-- drop index if exists onboarding_check_ins_token_hash_idx;
-- alter table onboarding_check_ins drop column if exists token_hash;
