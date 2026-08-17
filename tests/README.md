# Tests back (CRUD)

Ces tests tournent en pur Node (Vitest), sans navigateur ni front : ils
appellent directement Supabase pour vérifier que les insert/update/delete
sur les tables (`missions`, `candidates`, ...) marchent toujours après une
migration ou un changement de schéma.

## Mise en place (une fois)

1. Crée un projet Supabase **dédié aux tests** sur supabase.com (jamais celui
   de prod : les tests créent et suppriment de vraies lignes).
2. Dans le SQL Editor de ce projet, exécute dans l'ordre les scripts de
   `scripts/` (`001_noa_schema.sql`, `002_...`, etc.) pour recréer le schéma.
3. Récupère dans Project Settings → API :
   - `Project URL`
   - `service_role` key (secrète, jamais la `anon` key : les tests doivent
     contourner les policies RLS pour créer librement leurs données)
4. Crée un fichier `.env.test.local` à la racine (déjà ignoré par git) :

   ```
   SUPABASE_TEST_URL=https://xxxx.supabase.co
   SUPABASE_TEST_SERVICE_ROLE_KEY=eyJ...
   ```

## Lancer les tests

```bash
npm test          # une passe
npm run test:watch  # mode watch pendant le dev
```

## Ajouter un test CRUD

Un test par table/flux métier dans `tests/crud/`. Chaque fichier :
- crée sa propre `company` (et `mission` si besoin) dans `beforeAll`,
- nettoie tout dans `afterAll` via `delete` sur la `company` (cascade sur le
  reste grâce aux `on delete cascade` du schéma),
- ne dépend d'aucun autre test (peuvent tourner dans n'importe quel ordre).

Voir `tests/crud/missions.test.ts` et `tests/crud/candidates.test.ts` comme
modèles.
