import { describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";

// Vérifie que la clé ANTHROPIC_API_KEY est valide et que le modèle utilisé par
// noa (lib/noa/ai.ts) répond. Volontairement minimal (peu de tokens) : ce
// n'est pas un test de qualité des prompts, juste "l'IA est bien branchée".
// Consomme quelques tokens réels — appel payant, mais négligeable (< 0.001$).
const MODEL = "claude-sonnet-5";

describe("Connexion à l'IA (Anthropic)", () => {
  it("répond à un appel minimal avec le modèle configuré", async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY manquante — vérifie .env.local.");
    }

    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8,
      messages: [{ role: "user", content: "Réponds uniquement par le mot OK." }],
    });

    expect(response.model).toBe(MODEL);
    expect(response.stop_reason).not.toBe("error");

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    expect(text.toUpperCase()).toContain("OK");
  });
});
