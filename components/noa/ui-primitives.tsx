"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

// ─── Logo ───────────────────────────────────────────────────────────────────
export const NoaLogo = ({ scale = 1 }: { scale?: number }) => (
  <svg width={129 * scale} height={27 * scale} viewBox="0 0 129 27" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.00012207" y="14.2831" width="19.8793" height="10.7042" rx="5.35211" fill="#75DA9F"/>
    <rect x="20.9717" y="14.2831" width="8.51968" height="10.7042" rx="4.25984" fill="#99BAF8"/>
    <rect x="0.00012207" y="1.61292" width="10.7042" height="10.7042" rx="5.35211" fill="#FEE831"/>
    <rect x="12.0149" y="1.61292" width="17.4763" height="10.7042" rx="5.35211" fill="#CCB8FF"/>
    <path d="M57.9226 0.0921588C60.9024 0.0921588 63.2679 1.09056 65.0189 3.08736C66.77 5.05344 67.6455 7.72608 67.6455 11.1053V26.1734H58.6138V12.3034C58.6138 10.8288 58.2298 9.6768 57.4618 8.84736C56.6938 7.9872 55.6647 7.55712 54.3744 7.55712C53.0228 7.55712 51.9629 7.9872 51.1949 8.84736C50.4269 9.6768 50.0429 10.8288 50.0429 12.3034V26.1734H41.0112V0.322559H50.0429V4.00896C50.8416 2.8416 51.9168 1.90464 53.2685 1.19808C54.6202 0.460799 56.1716 0.0921588 57.9226 0.0921588Z" fill="white"/>
    <path d="M84.6281 26.496C82.0476 26.496 79.7283 25.9584 77.67 24.8832C75.6425 23.808 74.0451 22.272 72.8777 20.2752C71.7104 18.2784 71.1267 15.9283 71.1267 13.225C71.1267 10.5523 71.7104 8.2176 72.8777 6.2208C74.0758 4.224 75.6886 2.688 77.7161 1.6128C79.7744 0.537599 82.0937 0 84.6742 0C87.2547 0 89.5587 0.537599 91.5862 1.6128C93.6444 2.688 95.2572 4.224 96.4246 6.2208C97.6227 8.2176 98.2217 10.5523 98.2217 13.225C98.2217 15.8976 97.6227 18.2477 96.4246 20.2752C95.2572 22.272 93.6444 23.808 91.5862 24.8832C89.528 25.9584 87.2086 26.496 84.6281 26.496ZM84.6281 18.6624C85.8876 18.6624 86.9321 18.2016 87.7616 17.28C88.6217 16.3277 89.0518 14.976 89.0518 13.225C89.0518 11.4739 88.6217 10.1376 87.7616 9.216C86.9321 8.2944 85.903 7.8336 84.6742 7.8336C83.4454 7.8336 82.4163 8.2944 81.5868 9.216C80.7574 10.1376 80.3427 11.4739 80.3427 13.225C80.3427 15.0067 80.742 16.3584 81.5408 17.28C82.3395 18.2016 83.3686 18.6624 84.6281 18.6624Z" fill="white"/>
    <path d="M100.422 13.225C100.422 10.5523 100.898 8.2176 101.85 6.2208C102.833 4.224 104.154 2.688 105.813 1.6128C107.503 0.537599 109.377 0 111.435 0C113.217 0 114.753 0.35328 116.043 1.05984C117.333 1.7664 118.331 2.71872 119.038 3.9168V0.322559H128.07V26.1734H119.038V22.5792C118.331 23.7773 117.318 24.7296 115.997 25.4362C114.706 26.1427 113.186 26.496 111.435 26.496C109.377 26.496 107.503 25.9584 105.813 24.8832C104.154 23.808 102.833 22.272 101.85 20.2752C100.898 18.2477 100.422 15.8976 100.422 13.225ZM119.038 13.225C119.038 11.5661 118.577 10.2605 117.656 9.30816C116.765 8.35584 115.659 7.87968 114.338 7.87968C112.986 7.87968 111.865 8.35584 110.974 9.30816C110.083 10.2298 109.638 11.5354 109.638 13.225C109.638 14.8838 110.083 16.2048 110.974 17.1878C111.865 18.1402 112.986 18.6163 114.338 18.6163C115.659 18.6163 116.765 18.1402 117.656 17.1878C118.577 16.2355 119.038 14.9146 119.038 13.225Z" fill="white"/>
  </svg>
);

// ─── Primitives ───────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const btnClasses = (variant: BtnVariant, size: BtnSize, disabled: boolean, className: string) => {
  const sz = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-sm" }[size];
  const v = {
    primary: "bg-[#99BAF8] text-[#010101] hover:bg-[#85abf5] active:bg-[#7099e8]",
    secondary: "bg-white border border-gray-200 text-[#010101] hover:bg-gray-50",
    ghost: "text-gray-500 hover:text-[#010101] hover:bg-gray-100",
    danger: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100",
  }[variant];
  return `inline-flex items-center gap-2 font-semibold rounded-xl transition-all cursor-pointer ${sz} ${v} ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""} ${className}`;
};

export const Btn = ({
  children, variant = "primary", onClick, className = "", size = "md", disabled = false, type = "button",
}: {
  children: React.ReactNode; variant?: BtnVariant; onClick?: () => void;
  className?: string; size?: BtnSize; disabled?: boolean; type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={btnClasses(variant, size, disabled, className)}
  >
    {children}
  </button>
);

// Same visual treatment as Btn, but renders a navigable <Link> — use this
// instead of nesting <Btn> inside <Link> (which nests a <button> in an <a>).
export const LinkBtn = ({
  children, href, variant = "primary", className = "", size = "md",
}: {
  children: React.ReactNode; href: string; variant?: BtnVariant; className?: string; size?: BtnSize;
}) => (
  <Link href={href} className={btnClasses(variant, size, false, className)}>
    {children}
  </Link>
);

export const Card = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`bg-white rounded-2xl border border-black/[0.06] ${className}`} onClick={onClick}>{children}</div>
);

export type BadgeColor = "blue" | "violet" | "green" | "yellow" | "gray" | "red" | "orange";
export const Badge = ({ children, color }: { children: React.ReactNode; color: BadgeColor }) => {
  const c: Record<BadgeColor, string> = {
    blue: "bg-[#99BAF8]/20 text-[#3a6fd4]",
    violet: "bg-[#CCB8FF]/25 text-[#6b4ec4]",
    green: "bg-[#75DA9F]/20 text-[#1e8f52]",
    yellow: "bg-[#FEE831]/30 text-[#8a6a00]",
    gray: "bg-gray-100 text-gray-500",
    red: "bg-red-50 text-red-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[color]}`}>
      {children}
    </span>
  );
};

export const InputField = ({
  label, placeholder, type = "text", required = false, hint, name, value, onChange, defaultValue,
}: {
  label: string; placeholder?: string; type?: string; required?: boolean; hint?: string;
  name?: string; value?: string; onChange?: (v: string) => void; defaultValue?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-[#010101]">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] transition-all bg-white placeholder-gray-300 text-black"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

export const Textarea = ({
  label, placeholder, value, onChange, rows = 4, hint, name,
}: { label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number; hint?: string; name?: string }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-[#010101]">{label}</label>}
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] transition-all bg-white resize-none placeholder-gray-300 text-black"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

export const StepBar = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center gap-1.5">
    {steps.map((step, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
          i < current ? "bg-[#75DA9F] text-white" : i === current ? "border border-dashed border-[#75DA9F] text-[#75DA9F]" : "bg-gray-100 text-gray-400"
        }`}>
          {i < current ? <Check size={11} /> : i + 1}
        </div>
        <span className={`text-xs font-medium hidden lg:block ${i === current ? "text-[#010101]" : "text-gray-400"}`}>{step}</span>
        {i < steps.length - 1 && <div className={`w-6 h-px ${i < current ? "bg-[#75DA9F]" : "bg-gray-200"}`} />}
      </div>
    ))}
  </div>
);

export const BackLink = ({ onClick, href }: { onClick?: () => void; href?: string }) => {
  const className = "flex items-center gap-1.5 text-gray-400 hover:text-gray-500 text-xs font-medium mb-5 transition-colors group w-fit";
  const content = (
    <>
      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
      Retour
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
};

// ─── Candidate avatar helper ───────────────────────────────────────────────────
export const Avatar = ({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) => {
  const sz = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-base", lg: "w-14 h-14 text-xl" }[size];
  return (
    <div className={`${sz} rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${color}`} style={{ fontFamily: "Poppins, sans-serif" }}>
      {initials}
    </div>
  );
};
