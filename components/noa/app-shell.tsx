"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Settings, LogOut, Briefcase, Users, BarChart2,
} from "lucide-react";
import { NoaLogo } from "@/components/noa/ui-primitives";
import { signOut } from "@/app/(app)/actions";
import { TestFillButton } from "@/components/noa/test-fill-button";
import { initials } from "@/lib/noa/labels";

// Ressources masquée pour l'instant (page pas prête) : la route reste, seule
// l'entrée de nav est retirée. Réajouter { label: "Ressources", icon: BookOpen, href: "/ressources" } pour la ré-activer.
const NAV = [
  { label: "Dashboard", icon: BarChart2, href: "/dashboard" },
  { label: "Campagnes de recrutement", icon: Briefcase, href: "/missions" },
  { label: "Candidats", icon: Users, href: "/candidats" },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="w-60 h-full bg-[#010101] flex flex-col flex-shrink-0">
      <div className="p-6 pb-5">
        <NoaLogo scale={0.78} />
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active ? "bg-[#99BAF8]/20 text-[#99BAF8]" : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-3 border-t border-white/10 flex flex-col gap-0.5">
        <Link
          href="/parametres"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            pathname === "/parametres" ? "bg-[#99BAF8]/20 text-[#99BAF8]" : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          <Settings size={17} />
          Paramètres
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
};

type CurrentUser = { firstName: string; lastName: string; jobTitle: string | null };

const useCurrentUser = () => {
  const [value, setValue] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { firstName: string | null; lastName: string | null; jobTitle: string | null } | null) => {
        if (cancelled || !data?.firstName || !data?.lastName) return;
        setValue({ firstName: data.firstName, lastName: data.lastName, jobTitle: data.jobTitle });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return value;
};

const UserMenu = ({ user }: { user: CurrentUser | null }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu du profil"
        aria-expanded={open}
        className="w-8 h-8 rounded-full bg-[#CCB8FF]/30 flex items-center justify-center text-xs font-bold text-[#6b4ec4] select-none hover:bg-[#CCB8FF]/45 transition-all cursor-pointer"
      >
        {user ? initials(user.firstName, user.lastName) : ""}
      </button>

      {open && user && (
        <div className="absolute right-0 top-11 w-56 rounded-2xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.08] py-2 z-30 ">
          <div className="px-4 py-2.5 border-b border-black/[0.06]">
            <p className="text-sm font-semibold text-[#010101] truncate">{user.firstName} {user.lastName}</p>
            {user.jobTitle && <p className="text-xs text-gray-400 truncate">{user.jobTitle}</p>}
          </div>
          <Link
            href="/parametres"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#010101] transition-all"
          >
            <Settings size={15} />
            Voir / modifier le profil
          </Link>
        </div>
      )}
    </div>
  );
};

export const AppHeader = ({ title }: { title?: string }) => {
  const user = useCurrentUser();
  return (
    <header className="h-15 bg-white border-b border-black/[0.06] flex items-center px-6 gap-4 flex-shrink-0" style={{ height: 60 }}>
      {title && <span className="font-semibold text-[#010101] text-sm mr-auto">{title}</span>}
      <UserMenu user={user} />
    </header>
  );
};

export const AppLayout = ({
  children, headerTitle,
}: {
  children: React.ReactNode; headerTitle?: string;
}) => (
  <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader title={headerTitle} />
      <main className="flex-1 overflow-y-auto p-7 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
        {children}
      </main>
    </div>
    <TestFillButton />
  </div>
);
