import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "../test-client";

const supabase = createTestClient();

// Reproduit ce que fait createCandidate (app/candidats/actions.ts) :
// upload du CV dans le bucket privé cv-attachments sous {company_id}/..., puis
// liaison du chemin retourné à la fiche candidat via cv_url.
describe("Upload du CV candidat", () => {
  let companyId: string;
  let missionId: string;
  let candidateId: string;
  let cvPath: string;

  const fileContent = Buffer.from("%PDF-1.4 contenu factice de CV pour les tests\n");

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
      .insert({ company_id: companyId, title: "Mission test upload CV" })
      .select("id")
      .single();
    if (missionError) throw missionError;
    missionId = mission.id;

    cvPath = `${companyId}/${crypto.randomUUID()}-cv-test.pdf`;
  });

  afterAll(async () => {
    await supabase.storage.from("cv-attachments").remove([cvPath]);
    await supabase.from("companies").delete().eq("id", companyId);
  });

  it("upload le fichier dans le bucket cv-attachments", async () => {
    const { data, error } = await supabase.storage
      .from("cv-attachments")
      .upload(cvPath, fileContent, { contentType: "application/pdf" });

    expect(error).toBeNull();
    expect(data?.path).toBe(cvPath);
  });

  it("retélécharge le fichier avec le même contenu", async () => {
    const { data, error } = await supabase.storage.from("cv-attachments").download(cvPath);

    expect(error).toBeNull();
    const downloaded = Buffer.from(await data!.arrayBuffer());
    expect(downloaded.equals(fileContent)).toBe(true);
  });

  it("refuse un second upload au même chemin sans upsert", async () => {
    const { error } = await supabase.storage
      .from("cv-attachments")
      .upload(cvPath, fileContent, { contentType: "application/pdf" });

    // Comportement attendu de createCandidate : chaque CV a un chemin unique
    // (randomUUID), donc une collision ne devrait jamais arriver en usage
    // normal ; ce test garantit que le bucket ne l'autorise pas en silence.
    expect(error).not.toBeNull();
  });

  it("lie le CV uploadé à une fiche candidat (cv_url)", async () => {
    const { data, error } = await supabase
      .from("candidates")
      .insert({
        company_id: companyId,
        mission_id: missionId,
        first_name: "Grace",
        last_name: "Hopper",
        cv_url: cvPath,
      })
      .select("cv_url")
      .single();

    expect(error).toBeNull();
    expect(data?.cv_url).toBe(cvPath);
    candidateId = (
      await supabase.from("candidates").select("id").eq("cv_url", cvPath).single()
    ).data!.id;
  });

  it("retrouve le fichier CV à partir du candidat en base", async () => {
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("cv_url")
      .eq("id", candidateId)
      .single();
    expect(candidateError).toBeNull();

    const { data, error } = await supabase.storage.from("cv-attachments").download(candidate!.cv_url);
    expect(error).toBeNull();
    expect(Buffer.from(await data!.arrayBuffer()).equals(fileContent)).toBe(true);
  });

  it("supprime le fichier du bucket", async () => {
    const { error } = await supabase.storage.from("cv-attachments").remove([cvPath]);
    expect(error).toBeNull();

    // list() interroge l'API de stockage (métadonnées), pas le CDN : contrairement
    // à download(), il n'est pas exposé au cache-control du fichier déjà servi
    // par les tests précédents, ce qui rendrait cette vérification flaky.
    const [folder, filename] = [cvPath.split("/")[0], cvPath.split("/")[1]];
    const { data } = await supabase.storage.from("cv-attachments").list(folder, { search: filename });
    expect(data?.some((f) => f.name === filename)).toBe(false);
  });
});
