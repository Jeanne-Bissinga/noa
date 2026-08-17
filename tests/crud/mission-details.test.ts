import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";

const supabase = createTestClient();

describe("CRUD objectifs & compétences de mission", () => {
  let companyId: string;
  let missionId: string;

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
      .insert({ company_id: companyId, title: "Mission avec objectifs" })
      .select("id")
      .single();
    if (missionError) throw missionError;
    missionId = mission.id;
  });

  afterAll(async () => {
    await supabase.from("companies").delete().eq("id", companyId);
  });

  it("ajoute des objectifs de mission", async () => {
    const { data, error } = await supabase
      .from("mission_objectives")
      .insert([
        { mission_id: missionId, label: "Recruter avant fin de trimestre", position: 0 },
        { mission_id: missionId, label: "Budget respecté", position: 1 },
      ])
      .select("id");

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it("ajoute des compétences catégorisées et refuse une catégorie invalide", async () => {
    const { error: okError } = await supabase
      .from("mission_skills")
      .insert({ mission_id: missionId, category: "technique", name: "Node.js", position: 0 });
    expect(okError).toBeNull();

    const { error: badError } = await supabase
      .from("mission_skills")
      .insert({ mission_id: missionId, category: "inexistante", name: "N'importe quoi" });
    expect(badError).not.toBeNull();
  });

  it("liste les compétences par catégorie", async () => {
    const { data, error } = await supabase
      .from("mission_skills")
      .select("name")
      .eq("mission_id", missionId)
      .eq("category", "technique");

    expect(error).toBeNull();
    expect(data?.map((s) => s.name)).toEqual(["Node.js"]);
  });

  it("supprime la mission et vérifie la cascade sur objectifs et compétences", async () => {
    const { error } = await supabase.from("missions").delete().eq("id", missionId);
    expect(error).toBeNull();

    const { data: objectives } = await supabase.from("mission_objectives").select("id").eq("mission_id", missionId);
    const { data: skills } = await supabase.from("mission_skills").select("id").eq("mission_id", missionId);
    expect(objectives).toEqual([]);
    expect(skills).toEqual([]);
  });
});
