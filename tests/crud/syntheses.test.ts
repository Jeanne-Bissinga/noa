import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";
import { cleanupCompany, seedCandidate } from "../helpers";

const supabase = createTestClient();

describe("CRUD synthèses", () => {
  let companyId: string;
  let candidateId: string;
  let synthesisId: string;

  beforeAll(async () => {
    const seed = await seedCandidate(supabase);
    companyId = seed.companyId;
    candidateId = seed.candidateId;
  });

  afterAll(async () => {
    await cleanupCompany(supabase, companyId);
  });

  it("crée une synthèse générée par noa", async () => {
    const { data, error } = await supabase
      .from("syntheses")
      .insert({
        candidate_id: candidateId,
        authored_by: "noa",
        content: "Profil solide sur les compétences techniques.",
        advice: "Approfondir la motivation en topgrading.",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.authored_by).toBe("noa");
    synthesisId = data.id;
  });

  it("refuse un auteur hors de la contrainte check", async () => {
    const { error } = await supabase
      .from("syntheses")
      .insert({ candidate_id: candidateId, authored_by: "quelqu'un-d'autre" });
    expect(error).not.toBeNull();
  });

  it("permet plusieurs synthèses pour le même candidat (screening + topgrading)", async () => {
    const { data, error } = await supabase
      .from("syntheses")
      .insert({ candidate_id: candidateId, authored_by: "recruiter", content: "Note manuelle du recruteur." })
      .select("id");

    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    const { data: all } = await supabase.from("syntheses").select("id").eq("candidate_id", candidateId);
    expect(all).toHaveLength(2);
  });

  it("met à jour le contenu d'une synthèse", async () => {
    const { error } = await supabase
      .from("syntheses")
      .update({ content: "Contenu corrigé après relecture." })
      .eq("id", synthesisId);
    expect(error).toBeNull();

    const { data } = await supabase.from("syntheses").select("content").eq("id", synthesisId).single();
    expect(data?.content).toBe("Contenu corrigé après relecture.");
  });

  it("supprime une synthèse", async () => {
    const { error } = await supabase.from("syntheses").delete().eq("id", synthesisId);
    expect(error).toBeNull();

    const { data } = await supabase.from("syntheses").select("id").eq("id", synthesisId).maybeSingle();
    expect(data).toBeNull();
  });
});
