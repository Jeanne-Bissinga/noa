import { Briefcase, TriangleAlert, Users, Check } from "lucide-react";

// Static illustration of the "Candidats" kanban, reproduced from the Figma hero
// mockup. Purely decorative — no live data, initials/labels are placeholders.

const Bar = ({ w = "w-16", className = "" }: { w?: string; className?: string }) => (
  <div className={`h-1.5 ${w} rounded-full bg-gray-200 ${className}`} />
);

const MiniAvatar = ({ initials, className = "" }: { initials: string; className?: string }) => (
  <div className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[9px] font-bold ${className}`}>
    {initials}
  </div>
);

const CandidateRow = ({
  initials, avatarClass, interview = false,
}: { initials: string; avatarClass: string; interview?: boolean }) => (
  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2">
    <MiniAvatar initials={initials} className={avatarClass} />
    <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
      <Bar w="w-full" />
      {interview ? (
        <span className="text-[8px] font-bold uppercase tracking-wide text-[#4f7fd8]">Entretien</span>
      ) : (
        <Bar w="w-2/3" />
      )}
    </div>
  </div>
);

type Column = {
  title: string;
  dotClass: string;
  count: number;
  candidates: { initials: string; avatarClass: string; interview?: boolean }[];
};

const COLUMNS: Column[] = [
  {
    title: "Premier entretien",
    dotClass: "bg-[#99BAF8]",
    count: 3,
    candidates: [
      { initials: "BF", avatarClass: "bg-[#99BAF8]/25 text-[#3a6fd4]", interview: true },
      { initials: "MG", avatarClass: "bg-[#CCB8FF]/30 text-[#6b4ec4]" },
      { initials: "JB", avatarClass: "bg-[#99BAF8]/25 text-[#3a6fd4]", interview: true },
    ],
  },
  {
    title: "Entretien technique",
    dotClass: "bg-[#CCB8FF]",
    count: 2,
    candidates: [
      { initials: "PL", avatarClass: "bg-[#CCB8FF]/30 text-[#6b4ec4]" },
      { initials: "CF", avatarClass: "bg-[#99BAF8]/25 text-[#3a6fd4]", interview: true },
    ],
  },
  {
    title: "Décision finale",
    dotClass: "bg-[#75DA9F]",
    count: 1,
    candidates: [{ initials: "LC", avatarClass: "bg-[#75DA9F]/25 text-[#1e8f52]" }],
  },
  {
    title: "Recruté",
    dotClass: "bg-[#1e8f52]",
    count: 2,
    candidates: [
      { initials: "AD", avatarClass: "bg-[#75DA9F] text-white" },
      { initials: "TM", avatarClass: "bg-[#75DA9F] text-white" },
    ],
  },
  {
    title: "Non retenu",
    dotClass: "bg-gray-300",
    count: 4,
    candidates: [
      { initials: "OV", avatarClass: "bg-gray-200 text-gray-500" },
      { initials: "LF", avatarClass: "bg-gray-200 text-gray-500" },
      { initials: "PR", avatarClass: "bg-gray-200 text-gray-500" },
      { initials: "CL", avatarClass: "bg-gray-200 text-gray-500" },
    ],
  },
];

export function HeroKanban() {
  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <div className="pointer-events-none absolute -top-6 left-4 h-40 w-40 rounded-full bg-[#FEE831]/25 blur-[60px]" />
      <div className="pointer-events-none absolute -top-10 right-10 h-48 w-48 rounded-full bg-[#CCB8FF]/25 blur-[70px]" />

      {/* Positions are percentages of this box, matching the Figma export's proportions
          so the illustration scales as one piece instead of drifting at other widths. */}
      <div className="relative hidden min-[901px]:block min-[901px]:aspect-[600/210]">
        <div className="absolute left-0 top-[8%] flex w-[38%] items-start gap-2 rounded-2xl border border-[#99BAF8]/30 bg-[#F5F8FF] p-3 shadow-sm">
          <MiniAvatar initials="BF" className="h-7 w-7 bg-[#99BAF8]/30 text-[#3a6fd4]" />
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <Bar w="w-full" />
            <span className="text-[8px] font-bold uppercase tracking-wide text-[#4f7fd8]">Entretien</span>
          </div>
        </div>

        <div className="absolute left-[40%] top-0 flex aspect-square w-[9%] items-center justify-center rounded-full bg-[#99BAF8]/20">
          <Briefcase size={20} className="text-[#3a6fd4]" />
        </div>

        <div className="absolute left-[34%] top-[62%] flex aspect-square w-[8%] items-center justify-center rounded-full bg-[#FEE831]/30">
          <TriangleAlert size={16} className="text-[#8a6a00]" />
        </div>

        <div className="absolute left-[45%] top-[85%] flex aspect-square w-[7%] items-center justify-center rounded-full bg-[#CCB8FF]/30">
          <Users size={14} className="text-[#6b4ec4]" />
        </div>

        <div className="absolute right-0 top-0 w-[34%] rounded-2xl border border-[#75DA9F]/40 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#010101]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75DA9F]" />
              Décision finale
            </span>
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">1</span>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2">
            <MiniAvatar initials="LC" className="h-6 w-6 bg-[#75DA9F]/30 text-[#1e8f52]" />
            <Bar w="w-full" className="mt-1.5" />
          </div>
        </div>

        <div className="absolute right-[2%] top-[72%] w-[36%] rounded-2xl bg-white p-3.5 shadow-md">
          <p className="text-[15px] font-bold text-[#3a6fd4]">Product Designer</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={13} />
            6 candidats
          </p>
        </div>
        <div className="absolute right-0 top-[52%] flex aspect-square w-[8%] items-center justify-center rounded-full bg-[#75DA9F]/25">
          <Check size={16} className="text-[#1e8f52]" />
        </div>
      </div>

      <div className="relative mt-6 rounded-2xl bg-white p-4 shadow-lg min-[901px]:mt-8">
        <p className="text-sm font-bold text-[#010101]">Candidats</p>
        <p className="mb-3 text-xs text-gray-400">6 candidats en cours d&apos;évaluation</p>

        <div className="grid grid-cols-2 divide-x divide-gray-100 min-[641px]:grid-cols-3 min-[901px]:grid-cols-5">
          {COLUMNS.map(col => (
            <div key={col.title} className="flex flex-col gap-2 px-2 first:pl-0 last:pr-0">
              <div className="flex items-start justify-between gap-1">
                <span className="flex items-start gap-1 text-[10px] font-bold leading-tight text-[#010101]">
                  <span className={`mt-0.5 h-1.5 w-1.5 flex-none rounded-full ${col.dotClass}`} />
                  {col.title}
                </span>
                <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold text-gray-500">
                  {col.count}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {col.candidates.map(c => (
                  <CandidateRow key={c.initials} {...c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
