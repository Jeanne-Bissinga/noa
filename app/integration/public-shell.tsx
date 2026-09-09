import { NoaLogo } from "@/components/noa/ui-primitives";

/**
 * Cadre des pages publiques du collaborateur : une colonne étroite, centrée,
 * lisible sur mobile. Le logo est décoratif et ne renvoie nulle part — ces
 * pages ne sont pas une porte d'entrée vers Noa.
 *
 * Vit à la racine de /integration plutôt que dans une route : il est partagé,
 * et l'avoir logé dans un dossier de route l'aurait fait disparaître avec elle.
 */
export function PublicShell({
  children,
  footer = null,
}: {
  children: React.ReactNode;
  /** Phrase sous la carte ; null pour ne rien afficher. */
  footer?: string | null;
}) {
  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-10 sm:py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <NoaLogo scale={0.72} dark />
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-7">{children}</div>
        {footer && (
          <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">{footer}</p>
        )}
      </div>
    </main>
  );
}
