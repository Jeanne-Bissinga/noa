import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";

const supabase = createTestClient();

describe("CRUD missions", () => {
  let companyId: string;
  let missionId: string;

  beforeAll(async () => {
    const { data, error } = await supabase
      .from("companies")
      .insert({ name: `Test Co ${Date.now()}` })
      .select("id")
      .single();
    if (error) throw error;
    companyId = data.id;
  });

  afterAll(async () => {
    // Cascade delete depuis companies nettoie missions et tout ce qui en dépend.
    await supabase.from("companies").delete().eq("id", companyId);
  });

  it("crée une mission avec les valeurs par défaut attendues", async () => {
    const { data, error } = await supabase
      .from("missions")
      .insert({ company_id: companyId, title: "Développeur backend" })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe("brouillon");
    expect(data.process_step).toBe(0);
    missionId = data.id;
  });

  it("lit la mission créée", async () => {
    const { data, error } = await supabase.from("missions").select("*").eq("id", missionId).single();

    expect(error).toBeNull();
    expect(data.title).toBe("Développeur backend");
  });

  it("met à jour le statut d'une mission", async () => {
    const { error } = await supabase.from("missions").update({ status: "en_cours" }).eq("id", missionId);
    expect(error).toBeNull();

    const { data } = await supabase.from("missions").select("status").eq("id", missionId).single();
    expect(data?.status).toBe("en_cours");
  });

  it("refuse un statut hors de la contrainte check", async () => {
    const { error } = await supabase.from("missions").update({ status: "inexistant" }).eq("id", missionId);
    expect(error).not.toBeNull();
  });

  it("supprime la mission", async () => {
    const { error } = await supabase.from("missions").delete().eq("id", missionId);
    expect(error).toBeNull();

    const { data } = await supabase.from("missions").select("id").eq("id", missionId).maybeSingle();
    expect(data).toBeNull();
  });
});
