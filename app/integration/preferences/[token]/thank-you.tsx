import { Check } from "lucide-react";

export function ThankYou() {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 rounded-2xl bg-[#75DA9F]/15 flex items-center justify-center mx-auto mb-4">
        <Check size={20} className="text-[#1e8f52]" />
      </div>
      <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
        Merci
      </h1>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        Vos préférences de travail ont bien été enregistrées.
      </p>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
        Elles permettront de personnaliser certains éléments de votre intégration.
      </p>
      <p className="text-xs text-gray-400 mt-4">Vous pouvez maintenant fermer cette page.</p>
    </div>
  );
}
