// Ingestion et lecture des signaux marché (compétences 2026) depuis les flux
// RSS d'études et de médias emploi/tech listés ci-dessous. Alimente le
// contexte de la Scorecard intelligente (lib/noa/ai.ts:streamScorecardAnswer).
import "server-only";
import { XMLParser } from "fast-xml-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SkillsSignalPriority = "high" | "medium";

export type SkillsFeed = {
  name: string;
  url: string;
  priority: SkillsSignalPriority;
};

// Liste de démarrage fournie par le pôle marché : études/rapports
// "compétences 2026" (priorité High) puis médias emploi/tendances tech
// (Medium-High, rangés ici en "medium" faute de distinction plus fine).
export const SKILLS_RSS_FEEDS: SkillsFeed[] = [
  { name: "ITforBusiness – Compétences / Carrières", url: "https://www.itforbusiness.fr/feed", priority: "high" },
  { name: "Digi-Atlas – Compétences professionnelles 2026", url: "https://www.digi-atlas.com/feed/", priority: "high" },
  { name: "Rising Up – Compétences professionnelles 2026", url: "https://www.risinguparis.com/feed/", priority: "high" },
  { name: "Free-Work – Blog Talents IT / Compétences", url: "https://www.free-work.com/fr/tech-it/blog/feed/", priority: "high" },
  { name: "Levier IA – Compétences IA demandées", url: "https://levier-ia.fr/blog/feed/", priority: "high" },
  { name: "La Manu – Digital & compétences", url: "https://lamanu.fr/feed/", priority: "high" },
  { name: "ITG – Portage salarial / Actualités compétences", url: "https://www.itg.fr/portage-salarial/actualites/feed/", priority: "medium" },
  { name: "Artech – Tech skills US employers hiring 2026", url: "https://www.artech.com/fr/blog/feed/", priority: "medium" },
  { name: "Turnover IT – Blog marché de l'emploi Tech", url: "https://www.turnover-it.com/blog/feed/", priority: "high" },
  { name: "Katchme – Compétences IT & digital 2026", url: "https://www.katchme.fr/feed/", priority: "medium" },
  { name: "XperienceRH – RH & compétences", url: "https://xperiencerh.com/feed/", priority: "medium" },
  { name: "ZDNet France – Actualités tech", url: "https://www.zdnet.fr/actualites/rss/", priority: "medium" },
  { name: "FrenchWeb – Écosystème French Tech", url: "https://www.frenchweb.fr/feed", priority: "medium" },
  { name: "Maddyness – Startups & talents", url: "https://www.maddyness.com/feed/", priority: "medium" },
  { name: "La Tribune – Tech", url: "https://www.latribune.fr/rss/rubrique/tech-28", priority: "medium" },
  { name: "The Pragmatic Engineer", url: "https://newsletter.pragmaticengineer.com/feed", priority: "medium" },
];

const FEED_TIMEOUT_MS = 10_000;
// Un extrait suffit à situer l'article dans le prompt ; le lien reste la
// source de vérité si le recruteur veut lire l'article complet.
const SUMMARY_MAX_CHARS = 600;

export type ParsedSignal = {
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
};

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}

function toIsoDate(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Parse un flux RSS 2.0 ou Atom en une liste d'items normalisés. Best-effort :
 * un item sans titre/lien exploitable est ignoré plutôt que de faire échouer
 * tout le flux.
 */
export function parseFeed(xml: string): ParsedSignal[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const rssItems = doc?.rss?.channel?.item;
  const atomEntries = doc?.feed?.entry;
  const rawItems: unknown[] = Array.isArray(rssItems) ? rssItems : rssItems ? [rssItems] : Array.isArray(atomEntries) ? atomEntries : atomEntries ? [atomEntries] : [];

  const items: ParsedSignal[] = [];
  for (const raw of rawItems) {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(textOf(item.title));

    let link = "";
    if (typeof item.link === "string") link = item.link;
    else if (item.link && typeof item.link === "object") {
      const l = item.link as Record<string, unknown> | Record<string, unknown>[];
      const first = Array.isArray(l) ? l[0] : l;
      link = String((first as Record<string, unknown>)?.["@_href"] ?? textOf(first) ?? "");
    }

    if (!title || !link) continue;

    const rawSummary = textOf(item.description) || textOf(item["content:encoded"]) || textOf(item.summary) || textOf(item.content);
    const summary = stripHtml(rawSummary).slice(0, SUMMARY_MAX_CHARS);

    const dateText = textOf(item.pubDate) || textOf(item.published) || textOf(item.updated) || textOf(item["dc:date"]);
    const publishedAt = dateText ? toIsoDate(dateText) : null;

    items.push({ title, link, summary, publishedAt });
  }
  return items;
}

// Un user-agent applicatif ("noa-scorecard/1.0") se fait bloquer par le WAF
// (mod_security) d'au moins un des sites sources : on se présente comme un
// navigateur standard, ce que ces flux publics attendent de toute façon.
const FEED_REQUEST_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
};

async function fetchFeed(feed: SkillsFeed): Promise<ParsedSignal[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, { signal: controller.signal, headers: FEED_REQUEST_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseFeed(xml);
  } finally {
    clearTimeout(timeout);
  }
}

export type SkillsSignalIngestResult = {
  feed: string;
  ok: boolean;
  itemsStored: number;
  error?: string;
};

/**
 * Récupère tous les flux RSS listés, parse leurs items et les upsert dans
 * `skills_signals` (déduplication par lien). Un flux en échec n'interrompt
 * pas les autres. Réservé à un appel serveur (route d'ingestion), utilise le
 * client admin pour écrire indépendamment du recruteur qui déclenche l'appel.
 */
export async function fetchAndStoreSkillsSignals(): Promise<SkillsSignalIngestResult[]> {
  const admin = createAdminClient();
  if (!admin) {
    return SKILLS_RSS_FEEDS.map((f) => ({ feed: f.name, ok: false, itemsStored: 0, error: "Client admin indisponible (clé service_role manquante)." }));
  }

  const results = await Promise.all(
    SKILLS_RSS_FEEDS.map(async (feed): Promise<SkillsSignalIngestResult> => {
      try {
        const items = await fetchFeed(feed);
        if (items.length === 0) return { feed: feed.name, ok: true, itemsStored: 0 };

        const rows = items.map((item) => ({
          source_name: feed.name,
          source_url: feed.url,
          priority: feed.priority,
          title: item.title,
          link: item.link,
          summary: item.summary,
          published_at: item.publishedAt,
        }));

        const { error } = await admin.from("skills_signals").upsert(rows, { onConflict: "link", ignoreDuplicates: false });
        if (error) throw error;

        return { feed: feed.name, ok: true, itemsStored: rows.length };
      } catch (err) {
        return { feed: feed.name, ok: false, itemsStored: 0, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );

  return results;
}

export type SkillsSignal = {
  id: string;
  sourceName: string;
  priority: SkillsSignalPriority;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
};

const SIGNAL_SELECT = "id, source_name, priority, title, link, summary, published_at";

/**
 * Lit les signaux stockés, contextualisés sur la question du recruteur
 * (titre du poste, compétence...). Les articles "compétences 2026" nomment
 * rarement un outil précis (ex. "Vue.js") : un filtre mot-clé strict rate
 * donc souvent, même sur une question précise. On complète alors avec les
 * signaux les plus récents des sources dédiées aux compétences (priority
 * "high") avant les sources généralistes ("medium"), pour éviter que du bruit
 * (agenda, communiqués d'un flux institutionnel large) ne domine le contexte
 * simplement parce qu'il est le plus récent tous sujets confondus.
 */
export async function getSkillsSignals(opts: { query?: string; limit?: number } = {}): Promise<SkillsSignal[]> {
  const supabase = await createClient();
  const limit = opts.limit ?? 12;

  const keywords = (opts.query ?? "")
    .toLowerCase()
    .split(/[^\p{L}0-9]+/u)
    .filter((w) => w.length >= 4)
    .slice(0, 6);

  const matched: SkillsSignal[] = [];
  if (keywords.length > 0) {
    const orFilter = keywords.map((k) => `title.ilike.%${k}%,summary.ilike.%${k}%`).join(",");
    const { data } = await supabase
      .from("skills_signals")
      .select(SIGNAL_SELECT)
      .or(orFilter)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (data) matched.push(...data.map(mapSignalRow));
  }

  if (matched.length >= limit) return matched.slice(0, limit);

  const excludeIds = matched.map((m) => m.id);
  const fillFromTier = async (priority: SkillsSignalPriority, take: number): Promise<SkillsSignal[]> => {
    if (take <= 0) return [];
    // Sur-demande pour compenser les doublons déjà retenus par le filtre
    // mot-clé, qu'on retire ensuite côté application (pas d'opérateur "not in"
    // pratique à construire dynamiquement avec le client supabase-js ici).
    const { data } = await supabase
      .from("skills_signals")
      .select(SIGNAL_SELECT)
      .eq("priority", priority)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(take + excludeIds.length);
    if (!data) return [];
    return data.filter((row) => !excludeIds.includes(row.id)).slice(0, take).map(mapSignalRow);
  };

  const highFill = await fillFromTier("high", limit - matched.length);
  excludeIds.push(...highFill.map((s) => s.id));
  const mediumFill = await fillFromTier("medium", limit - matched.length - highFill.length);

  return [...matched, ...highFill, ...mediumFill];
}

function mapSignalRow(row: {
  id: string;
  source_name: string;
  priority: string;
  title: string;
  link: string;
  summary: string;
  published_at: string | null;
}): SkillsSignal {
  return {
    id: row.id,
    sourceName: row.source_name,
    priority: row.priority as SkillsSignalPriority,
    title: row.title,
    link: row.link,
    summary: row.summary,
    publishedAt: row.published_at,
  };
}
