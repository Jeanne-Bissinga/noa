import Link from "next/link";
import {
  Briefcase, Users, BarChart2, AlertTriangle, Plus, ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, Avatar } from "@/components/noa/ui-primitives";
import {
  requireRecruiter, getMissions, getCandidates,
  getInterviewsForCandidates, getDecisionsForCandidates,
} from "@/lib/noa/queries";
import { pendingDecisions } from "@/lib/noa/pending-decisions";
import type { DecisionStage, Mission } from "@/lib/noa/types";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_DOT, CANDIDATE_BADGE, CANDIDATE_AVATAR_COLOR,
  formatDate, initials,
} from "@/lib/noa/labels";

const PENDING_STAGE_LABEL: Record<DecisionStage, string> = {
  screening: "Screening terminé · à trancher",
  topgrading: "Topgrading terminé · à trancher",
  final: "Décision finale à prendre",
};

const PENDING_STAGE_HREF: Record<DecisionStage, (candidateId: string) => string> = {
  screening: (id) => `/candidats/${id}/screening/decision`,
  topgrading: (id) => `/candidats/${id}/topgrading/decision`,
  final: (id) => `/candidats/${id}/decision-finale`,
};

export default async function DashboardPage() {
  const recruiter = await requireRecruiter();
  const companyId = recruiter.company_id;

  const [missions, candidates] = await Promise.all([
    getMissions(companyId),
    getCandidates(companyId),
  ]);

  const candidateIds = candidates.map((c) => c.id);
  const [interviews, decisions] = await Promise.all([
    getInterviewsForCandidates(candidateIds),
    getDecisionsForCandidates(candidateIds),
  ]);

  const activeMissions = missions.filter((m) => m.status === "en_cours" || m.status === "brouillon");
  const candidatesInProgress = candidates.filter((c) => c.status !== "Non retenu");
  const interviewsThisWeek = candidates.filter(
    (c) => c.screening_status === "current" || c.topgrading_status === "current",
  );
  const pending = pendingDecisions(candidates, interviews, decisions);

  const recentMissions = missions.slice(0, 3);
  const recentCandidates = candidates.slice(0, 3);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout headerTitle="Dashboard">
      <div className="max-w-5xl mx-auto">
        {/* Hero banner */}
        <div className="bg-[#010101] rounded-2xl px-7 py-6 mb-7 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 mb-1.5 capitalize">{today}</p>
            <h1 className="text-2xl font-bold text-white mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
              Bonjour, {recruiter.first_name} 👋
            </h1>
            <p className="text-sm text-gray-400">
              Vous avez <span className="font-bold text-white">{pending.length} décision{pending.length !== 1 ? "s" : ""}</span> en attente cette semaine.
            </p>
          </div>
          <Link
            href="/missions/nouvelle"
            className="flex items-center gap-2 bg-white text-[#010101] text-sm font-bold px-5 py-3 rounded-xl hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <Plus size={15} />
            Nouvelle mission
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3.5 mb-7">
          {[
            { l: "Recrutements actifs", v: activeMissions.length, icon: <Briefcase size={15} />, c: "bg-[#99BAF8]/10 border-[#99BAF8]/20", t: "text-[#3a6fd4]", sub: "Missions en cours" },
            { l: "Candidats en cours", v: candidatesInProgress.length, icon: <Users size={15} />, c: "bg-[#CCB8FF]/10 border-[#CCB8FF]/20", t: "text-[#6b4ec4]", sub: "Tous statuts" },
            { l: "Entretiens prévus", v: interviewsThisWeek.length, icon: <BarChart2 size={15} />, c: "bg-[#75DA9F]/10 border-[#75DA9F]/20", t: "text-[#1e8f52]", sub: "Cette semaine" },
            { l: "Décisions en attente", v: pending.length, icon: <AlertTriangle size={15} />, c: "bg-[#FEE831]/10 border-[#FEE831]/30", t: "text-[#8a6a00]", sub: "À traiter" },
          ].map((s) => (
            <Card key={s.l} className={`p-5 ${s.c}`}>
              <div className={`flex items-center gap-1.5 mb-3 ${s.t}`}>{s.icon}<span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.sub}</span></div>
              <div className={`text-4xl font-bold ${s.t}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.v}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">{s.l}</div>
            </Card>
          ))}
        </div>

        {/* Décisions en attente — masqué quand il n'y a rien à trancher */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-[#010101] text-sm mb-3">Décisions en attente</h2>
            <div className="grid grid-cols-3 gap-3">
              {pending.map(({ candidate: c, stage }) => (
                <Link
                  key={c.id}
                  href={PENDING_STAGE_HREF[stage](c.id)}
                  className="group bg-white rounded-2xl border border-[#FEE831]/40 p-4 hover:border-[#FEE831] hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
                >
                  <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#010101] truncate group-hover:text-[#3a6fd4] transition-colors">{c.first_name} {c.last_name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{PENDING_STAGE_LABEL[stage]}</div>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recrutements actifs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#010101] text-sm">Recrutements actifs</h2>
            <Link href="/missions" className="text-xs text-[#3a6fd4] font-semibold hover:underline flex items-center gap-1">Voir tout <ChevronRight size={11} /></Link>
          </div>
          {recentMissions.length === 0 ? (
            <Card className="p-8 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-semibold text-[#010101]">Aucune mission pour le moment</p>
              <p className="text-xs text-gray-400">Créez votre première fiche de poste pour démarrer un recrutement.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recentMissions.map((m: Mission) => {
                const missionCandidates = candidates.filter((c) => c.mission_id === m.id);
                return (
                  <Link
                    key={m.id}
                    href={`/missions/${m.id}`}
                    className="group bg-white rounded-2xl border border-black/[0.06] p-4 hover:border-[#99BAF8]/40 hover:shadow-sm hover:shadow-[#99BAF8]/10 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-sm text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-snug mb-1.5">{m.title}</div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${MISSION_STATUS_DOT[m.status]}`} />
                      <span className="text-[10px] text-gray-400 font-medium">{MISSION_STATUS_LABEL[m.status]}</span>
                      <span className="text-gray-200 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-400">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Users size={11} />{missionCandidates.length} candidat{missionCandidates.length !== 1 ? "s" : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Candidats récents */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#010101] text-sm">Candidats récents</h2>
            <Link href="/candidats" className="text-xs text-[#3a6fd4] font-semibold hover:underline flex items-center gap-1">Voir tout <ChevronRight size={11} /></Link>
          </div>
          {recentCandidates.length === 0 ? (
            <Card className="p-8 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-semibold text-[#010101]">Aucun candidat pour le moment</p>
              <p className="text-xs text-gray-400">Ajoutez un candidat depuis une mission pour démarrer l'évaluation.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recentCandidates.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidats/${c.id}`}
                  className="group bg-white rounded-2xl border border-black/[0.06] p-4 hover:border-[#99BAF8]/40 hover:shadow-sm hover:shadow-[#99BAF8]/10 transition-all cursor-pointer flex items-center gap-3"
                >
                  <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#010101] truncate group-hover:text-[#3a6fd4] transition-colors">{c.first_name} {c.last_name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{c.title ?? "-"}</div>
                  </div>
                  <Badge color={CANDIDATE_BADGE[c.status] ?? "gray"}>{c.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="font-bold text-[#010101] text-sm mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ajouter un candidat", desc: "Importer un CV", icon: <Users size={15} />, color: "text-[#6b4ec4] bg-[#CCB8FF]/12", href: "/candidats/nouveau" },
              { label: "Nouvelle mission", desc: "Créer une fiche de poste", icon: <Briefcase size={15} />, color: "text-[#3a6fd4] bg-[#99BAF8]/12", href: "/missions/nouvelle" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="group flex items-center gap-3 bg-white rounded-2xl border border-black/[0.06] px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>{a.icon}</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors">{a.label}</div>
                  <div className="text-[10px] text-gray-400">{a.desc}</div>
                </div>
                <ChevronRight size={13} className="ml-auto text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
