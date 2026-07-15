"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { Btn } from "@/components/noa/ui-primitives";
import { validateJobSpec } from "../actions";

export function ValidateButton({ missionId }: { missionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Btn
      variant="primary"
      size="lg"
      disabled={pending}
      onClick={() => startTransition(() => validateJobSpec(missionId))}
    >
      <Check size={15} />
      {pending ? "Validation en cours…" : "Valider la fiche de poste"}
    </Btn>
  );
}
