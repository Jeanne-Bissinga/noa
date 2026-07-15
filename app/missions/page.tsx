import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, LinkBtn } from "@/components/noa/ui-primitives";
import { requireRecruiter, getMissions, getCandidates } from "@/lib/noa/queries";
import { MISSION_STATUS_LABEL, MISSION_STATUS_COLOR, REASON_LABEL, formatDate } from "@/lib/noa/labels";

export default async function MissionsPage() {
  const recruiter = await requireRecruiter();
  const companyId = recruiter.company_id;

  const [missions, candidates] = await Promise.all([
    getMissions(companyId),
    getCandidates(companyId),
  ]);

  return (
    <AppLayout headerTitle="Missions">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Campagne de recrutement</h1>
            <p className="text-gray-400 text-sm mt-1">{missions.length} mission{missions.length !== 1 ? "s" : ""} active{missions.length !== 1 ? "s" : ""}</p>
          </div>
          <LinkBtn href="/missions/nouvelle" variant="primary"><Plus size={15} />Nouvelle mission</LinkBtn>
        </div>

        {missions.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-semibold text-[#010101]">Aucune mission pour le moment</p>
            <p className="text-xs text-gray-400">Créez votre première fiche de poste pour démarrer un recrutement.</p>
            <LinkBtn href="/missions/nouvelle" variant="primary" size="sm"><Plus size={13} />Nouvelle mission</LinkBtn>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {missions.map((m) => {
              const missionCandidates = candidates.filter((c) => c.mission_id === m.id);
              return (
                <Link key={m.id} href={`/missions/${m.id}`}>
                  <Card className="p-6 hover:border-[#99BAF8]/25 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-[#010101]">{m.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{m.reason ? REASON_LABEL[m.reason] ?? m.reason : "—"}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">Créée le {formatDate(m.created_at)}</span>
                        </div>
                      </div>
                      <Badge color={MISSION_STATUS_COLOR[m.status]}>{MISSION_STATUS_LABEL[m.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Users size={12} />
                        {missionCandidates.length} candidat{missionCandidates.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
