"use client";

// In-page section link that smooth-scrolls without pushing a `#hash` entry into
// history. Native `<a href="#section">` clicks add a hashed history entry, and
// Next.js App Router fails to re-render the route when the browser later pops
// back to that hashed URL from another page — leaving the URL and the visible
// page out of sync. Calling preventDefault avoids creating that entry entirely.
export function ScrollLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.replace(/^#/, "");
    const el = id ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <a href={href} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
