"use client";

import { FileText, X } from "lucide-react";
import { Avatar } from "@/components/noa/ui-primitives";
import type { Candidate, CandidateExperience, CandidateSkill } from "@/lib/noa/types";

export function CvModal({
  candidate, experiences, skills, cvSignedUrl, avatarColor, onClose,
}: {
  candidate: Candidate;
  experiences: CandidateExperience[];
  skills: CandidateSkill[];
  cvSignedUrl: string | null;
  avatarColor: string;
  onClose: () => void;
}) {
  const name = `${candidate.first_name} ${candidate.last_name}`;
  const initials = `${candidate.first_name.charAt(0)}${candidate.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <Avatar initials={initials} color={avatarColor} size="sm" />
            <div>
              <p className="text-sm font-bold text-[#010101]">{name}</p>
              <p className="text-[10px] text-gray-400">CV · Lecture seule</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
            <X size={13} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${avatarColor}`}>
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h2>
              {candidate.title && <p className="text-sm text-gray-500 mt-0.5">{candidate.title}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                {candidate.location && <span className="text-[10px] text-gray-400">{candidate.location}</span>}
                {candidate.email && <span className="text-[10px] text-gray-400">{candidate.email}</span>}
              </div>
            </div>
          </div>

          {cvSignedUrl && (
            <a
              href={cvSignedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-[#3a6fd4] hover:underline w-fit"
            >
              <FileText size={13} />Ouvrir le fichier CV original
            </a>
          )}

          {candidate.summary && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Résumé</p>
                <p className="text-xs text-gray-600 leading-relaxed">{candidate.summary}</p>
              </div>
            </>
          )}

          {experiences.length > 0 && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Expériences</p>
                <div className="flex flex-col gap-0">
                  {experiences.map((exp, i) => (
                    <div key={exp.id} className="flex gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#99BAF8] mt-1.5 flex-shrink-0" />
                        {i < experiences.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-[#010101]">{exp.role}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{exp.period}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[#3a6fd4] mb-2">{exp.company}</p>
                        <ul className="flex flex-col gap-1">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
                              <span className="text-gray-300 flex-shrink-0 mt-0.5">•</span>{b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {skills.length > 0 && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span key={skill.id} className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-3 py-1">{skill.name}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
