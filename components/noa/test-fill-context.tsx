"use client";

// Registre global permettant à n'importe quelle page-formulaire de brancher
// une fonction "remplis-moi avec des données fixes" (mock des useState locaux,
// aucun appel IA ni écriture en base) que le bouton flottant de test peut
// déclencher, quelle que soit la page affichée.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Filler = () => void;

type TestFillContextValue = {
  registerFiller: (fn: Filler) => () => void;
  fillCurrent: () => void;
  hasFiller: boolean;
};

const TestFillContext = createContext<TestFillContextValue | null>(null);

export const TestFillProvider = ({ children }: { children: React.ReactNode }) => {
  const fillerRef = useRef<Filler | null>(null);
  const [hasFiller, setHasFiller] = useState(false);

  const registerFiller = useCallback((fn: Filler) => {
    fillerRef.current = fn;
    setHasFiller(true);
    return () => {
      if (fillerRef.current === fn) {
        fillerRef.current = null;
        setHasFiller(false);
      }
    };
  }, []);

  const fillCurrent = useCallback(() => {
    fillerRef.current?.();
  }, []);

  return (
    <TestFillContext.Provider value={{ registerFiller, fillCurrent, hasFiller }}>
      {children}
    </TestFillContext.Provider>
  );
};

function useTestFillContext() {
  return useContext(TestFillContext);
}

export function useTestFill() {
  const ctx = useTestFillContext();
  if (!ctx) throw new Error("useTestFill doit être utilisé sous TestFillProvider.");
  return ctx;
}

/**
 * À appeler dans une page-formulaire : enregistre `fill` comme la fonction
 * que le bouton de test déclenchera tant que ce composant est monté. `fill`
 * doit se contenter d'appeler les setState locaux avec des valeurs fixes —
 * jamais de fetch, d'IA, ou de soumission automatique du formulaire.
 */
export function useRegisterTestFiller(fill: Filler) {
  const ctx = useTestFillContext();
  const fillRef = useRef(fill);

  useEffect(() => {
    fillRef.current = fill;
  });

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerFiller(() => fillRef.current());
  }, [ctx]);
}
