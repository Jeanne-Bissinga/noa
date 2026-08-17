import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";
import { cleanupCompany, seedCandidate } from "../helpers";

const supabase = createTestClient();

describe("CRUD entretiens (interviews, grilles, guides)", () => {
  let companyId: string;
  let candidateId: string;
  let interviewId: string;

  beforeAll(async () => {
    const seed = await seedCandidate(supabase);
    companyId = seed.companyId;
    candidateId = seed.candidateId;
  });

  afterAll(async () => {
    await cleanupCompany(supabase, companyId);
  });

  it("crée un entretien de screening", async () => {
    const { data, error } = await supabase
      .from("interviews")
      .insert({ candidate_id: candidateId, type: "screening", format: "visio" })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe("planifie");
    interviewId = data.id;
  });

  it("refuse un second entretien du même type pour le même candidat (contrainte unique)", async () => {
    const { error } = await supabase.from("interviews").insert({ candidate_id: candidateId, type: "screening" });
    expect(error).not.toBeNull();
  });

  it("attache une grille d'évaluation à l'entretien", async () => {
    const { data, error } = await supabase
      .from("evaluation_grids")
      .insert({
        interview_id: interviewId,
        criteria: [{ label: "Communication" }],
        answers: { communication: "bon" },
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data.id).toBeDefined();
  });

  it("refuse une seconde grille pour le même entretien (contrainte unique)", async () => {
    const { error } = await supabase.from("evaluation_grids").insert({ interview_id: interviewId });
    expect(error).not.toBeNull();
  });

  it("attache un guide d'entretien", async () => {
    const { error } = await supabase.from("interview_guides").insert({
      interview_id: interviewId,
      questions: ["Parlez-moi de votre dernier poste"],
      topics: ["expérience"],
    });
    expect(error).toBeNull();
  });

  it("marque l'entretien comme terminé", async () => {
    const { error } = await supabase
      .from("interviews")
      .update({ status: "termine", completed_at: new Date().toISOString() })
      .eq("id", interviewId);
    expect(error).toBeNull();

    const { data } = await supabase.from("interviews").select("status").eq("id", interviewId).single();
    expect(data?.status).toBe("termine");
  });

  it("supprime l'entretien et vérifie la cascade sur grille et guide", async () => {
    const { error } = await supabase.from("interviews").delete().eq("id", interviewId);
    expect(error).toBeNull();

    const { data: grids } = await supabase.from("evaluation_grids").select("id").eq("interview_id", interviewId);
    const { data: guides } = await supabase.from("interview_guides").select("id").eq("interview_id", interviewId);
    expect(grids).toEqual([]);
    expect(guides).toEqual([]);
  });
});
