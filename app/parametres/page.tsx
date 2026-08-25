import { requireRecruiter } from "@/lib/noa/queries";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const recruiter = await requireRecruiter();
  return <SettingsForm recruiter={recruiter} />;
}
