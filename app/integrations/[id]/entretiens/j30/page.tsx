import { MilestonePage } from "../milestone-page";

// Le jalon est porté par le dossier : toute la logique vit dans MilestonePage.
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return MilestonePage({ params, milestone: "integration_j30" });
}
