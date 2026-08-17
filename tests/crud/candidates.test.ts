import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";

const supabase = createTestClient();

describe("CRUD candidats", () => {
  let companyId: string;
  let missionId: string;
  let candidateId: string;

  beforeAll(async () => {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name: `Test Co ${Date.now()}` })
      .select("id")
      .single();
    if (companyError) throw companyError;
    companyId = company.id;

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .insert({ company_id: companyId, title: "Mission test" })
      .select("id")
      .single();
    if (missionError) throw missionError;
    missionId = mission.id;
  });

  afterAll(async () => {
    await supabase.from("companies").delete().eq("id", companyId);
  });

  it("crée un candidat avec le statut initial Screening", async () => {
    const { data, error } = await supabase
      .from("candidates")
      .insert({
        company_id: companyId,
        mission_id: missionId,
        first_name: "Ada",
        last_name: "Lovelace",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe("Screening");
    expect(data.screening_status).toBe("current");
    candidateId = data.id;
  });

  it("ajoute des compétences liées au candidat", async () => {
    const { error } = await supabase.from("candidate_skills").insert([
      { candidate_id: candidateId, name: "TypeScript" },
      { candidate_id: candidateId, name: "SQL" },
    ]);
    expect(error).toBeNull();

    const { data } = await supabase.from("candidate_skills").select("name").eq("candidate_id", candidateId);
    expect(data?.map((s) => s.name).sort()).toEqual(["SQL", "TypeScript"]);
  });

  it("fait avancer le candidat vers Topgrading", async () => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: "Topgrading", screening_status: "done", topgrading_status: "current" })
      .eq("id", candidateId);
    expect(error).toBeNull();

    const { data } = await supabase.from("candidates").select("status").eq("id", candidateId).single();
    expect(data?.status).toBe("Topgrading");
  });

  it("supprime le candidat et ses compétences en cascade", async () => {
    const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
    expect(error).toBeNull();

    const { data: skills } = await supabase.from("candidate_skills").select("id").eq("candidate_id", candidateId);
    expect(skills).toEqual([]);
  });
});
