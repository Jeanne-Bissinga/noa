// Longueur minimale exigée pour un mot de passe. Partagée entre l'action
// serveur qui la vérifie et le formulaire qui l'annonce à l'utilisateur, pour
// que les deux ne puissent pas diverger. Doit rester au moins égale au
// minimum configuré côté Supabase (Authentication -> Policies).
export const MIN_PASSWORD_LENGTH = 8;
