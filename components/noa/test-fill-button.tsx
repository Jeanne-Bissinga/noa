"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { isTestFillAccount } from "@/app/(app)/test-fill-actions";
import { useTestFill } from "@/components/noa/test-fill-context";

// Visible uniquement pour le compte de test : remplit le formulaire de la
// page courante avec des données fixes (mock des useState), sans IA ni écriture
// en base. Chaque page-formulaire s'enregistre via useRegisterTestFiller ;
// s'il n'y en a pas sur la page affichée, le bouton reste désactivé.
export const TestFillButton = () => {
  const [visible, setVisible] = useState(false);
  const { fillCurrent, hasFiller } = useTestFill();

  useEffect(() => {
    isTestFillAccount().then(setVisible).catch(() => setVisible(false));
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={fillCurrent}
      disabled={!hasFiller}
      title={hasFiller ? "Remplir le formulaire avec des données de test" : "Aucun formulaire à remplir sur cette page"}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg transition-all ${
        hasFiller ? "hover:bg-black/85" : "opacity-40 cursor-not-allowed"
      }`}
    >
      <Sparkles size={15} />
      Remplir (test)
    </button>
  );
};
