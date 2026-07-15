import { requireRecruiter } from "@/lib/noa/queries";
import { ResourcesView } from "./resources-view";

export default async function ResourcesPage() {
  await requireRecruiter();

  return <ResourcesView />;
}
