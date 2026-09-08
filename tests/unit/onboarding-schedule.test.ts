import { describe, it, expect } from "vitest";
import {
  planInterviews, tokenExpiryFor, dayOfOnboarding, hasArrived,
  INTEGRATION_INTERVIEWS, TOKEN_TTL_DAYS,
} from "@/lib/noa/onboarding/schedule";

const START = new Date("2026-03-02T09:00:00.000Z");

describe("planInterviews", () => {
  const plan = planInterviews(START);

  it("programme exactement les quatre entretiens", () => {
    expect(plan).toHaveLength(4);
    expect(plan.map((i) => i.type)).toEqual([
      "integration_j1",
      "integration_j30",
      "integration_j60",
      "integration_j90",
    ]);
  });

  it("place le J1 le jour de l'arrivée", () => {
    // Le J1 ouvre le parcours, il ne mesure pas une étape : il tombe le jour
    // même, pas une semaine après.
    expect(plan[0].scheduledAt.toISOString()).toBe("2026-03-02T09:00:00.000Z");
  });

  it("place les suivants à 30, 60 et 90 jours", () => {
    expect(plan[1].scheduledAt.toISOString()).toBe("2026-04-01T09:00:00.000Z");
    expect(plan[2].scheduledAt.toISOString()).toBe("2026-05-01T09:00:00.000Z");
    expect(plan[3].scheduledAt.toISOString()).toBe("2026-05-31T09:00:00.000Z");
  });

  it("ne programme aucun point hebdomadaire", () => {
    expect(INTEGRATION_INTERVIEWS.map((i) => i.offsetDays)).toEqual([0, 30, 60, 90]);
    expect(JSON.stringify(plan)).not.toContain("weekly");
  });
});

describe("expiration des liens", () => {
  it("expire un lien après la durée prévue", () => {
    const expiry = tokenExpiryFor(START);
    expect((expiry.getTime() - START.getTime()) / (24 * 60 * 60 * 1000)).toBe(TOKEN_TTL_DAYS);
  });
});

describe("dayOfOnboarding", () => {
  it("compte J1 le jour de l'arrivée", () => {
    expect(dayOfOnboarding("2026-03-02", new Date("2026-03-02T14:00:00"))).toBe(1);
  });

  it("compte J31 un mois après", () => {
    expect(dayOfOnboarding("2026-03-02", new Date("2026-04-01T09:00:00"))).toBe(31);
  });

  it("renvoie 0 avant la prise de poste et null sans date", () => {
    // « On ne sait pas encore quand » et « il n'est pas encore arrivé » sont
    // deux choses différentes.
    expect(dayOfOnboarding("2026-04-01", new Date("2026-03-02T09:00:00"))).toBe(0);
    expect(dayOfOnboarding(null, new Date("2026-03-02T09:00:00"))).toBeNull();
  });
});

describe("hasArrived", () => {
  it("est vrai à partir du jour d'arrivée, faux sans date", () => {
    expect(hasArrived("2026-03-02", new Date("2026-03-02T08:00:00"))).toBe(true);
    expect(hasArrived("2026-03-02", new Date("2026-03-01T23:00:00"))).toBe(false);
    expect(hasArrived(null, new Date("2026-03-02T09:00:00"))).toBe(false);
  });
});
