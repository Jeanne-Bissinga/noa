// Remplace le paquet `server-only` sous Vitest.
//
// `server-only` lève à l'import dès qu'il n'est pas chargé dans un Server
// Component : hors de Next, c'est-à-dire dans les tests, tout module qui le
// garde devient intestable. Le garde-fou reste en place dans le code (il
// protège du vrai risque : importer un module serveur depuis le navigateur),
// il est seulement neutralisé ici.
export {};
