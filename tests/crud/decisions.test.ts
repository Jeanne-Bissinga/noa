import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";
import { cleanupCompany, seedCandidate } from "../helpers";

const supabase = createTestClient();

describe("CRUD décisions", () => {
  let companyId: string;
  let candidateId: string;
  let decisionId: string;

  beforeAll(async () => {
    const seed = await seedCandidate(supabase);
    companyId = seed.companyId;
    candidateId = seed.candidateId;
  });

  afterAll(async () => {
    await cleanupCompany(supabase, companyId);
  });

  it("enregistre une décision de screening", async () => {
    const { data, error } = await supabase
      .from("decisions")
      .insert({ candidate_id: candidateId, stage: "screening", status: "retenu" })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe("retenu");
    decisionId = data.id;
  });

  it("refuse un stage ou un status hors des contraintes check", async () => {
    const { error: badStage } = await supabase
      .from("decisions")
      .insert({ candidate_id: candidateId, stage: "inexistant", status: "retenu" });
    expect(badStage).not.toBeNull();

    const { error: badStatus } = await supabase
      .from("decisions")
      .insert({ candidate_id: candidateId, stage: "topgrading", status: "inexistant" });
    expect(badStatus).not.toBeNull();
  });

  it("enregistre une décision par étape (screening, topgrading, final)", async () => {
    const { error } = await supabase.from("decisions").insert([
      { candidate_id: candidateId, stage: "topgrading", status: "retenu" },
      { candidate_id: candidateId, stage: "final", status: "reporte", reason: "Attente disponibilité." },
    ]);
    expect(error).toBeNull();

    const { data } = await supabase.from("decisions").select("stage").eq("candidate_id", candidateId);
    expect(data?.map((d) => d.stage).sort()).toEqual(["final", "screening", "topgrading"]);
  });

  it("annule une décision (retour en arrière du kanban) en la supprimant", async () => {
    const { error } = await supabase.from("decisions").delete().eq("id", decisionId);
    expect(error).toBeNull();

    const { data } = await supabase.from("decisions").select("id").eq("id", decisionId).maybeSingle();
    expect(data).toBeNull();
  });

  it("supprime le candidat et vérifie la cascade sur ses décisions restantes", async () => {
    const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
    expect(error).toBeNull();

    const { data } = await supabase.from("decisions").select("id").eq("candidate_id", candidateId);
    expect(data).toEqual([]);
  });
});
