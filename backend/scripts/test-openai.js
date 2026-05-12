import { z } from "zod";
import { env } from "../src/config/env.js";
import { OpenAIClientService } from "../src/services/OpenAIClientService.js";

const testResponseSchema = z.object({
  status: z.literal("ok"),
  response: z.string().trim().min(1).max(120)
});

async function main() {
  if (!OpenAIClientService.isEnabled()) {
    console.log("OpenAI unavailable");
    console.log(`Model: ${env.openaiModel}`);
    console.log("Response: OPENAI_API_KEY ausente no backend/.env.");
    process.exitCode = 1;
    return;
  }

  const result = await OpenAIClientService.generateStructuredObject({
    schema: testResponseSchema,
    systemPrompt: [
      "Você valida uma integração técnica do backend FinSync com a OpenAI.",
      "Responda SOMENTE JSON válido.",
      'Use exatamente o formato {"status":"ok","response":"Integração funcionando."}.'
    ].join(" "),
    userPrompt: "Retorne a confirmação curta da integração."
  });

  if (!result) {
    console.log("OpenAI failed");
    console.log(`Model: ${env.openaiModel}`);
    console.log("Response: chamada sem resposta válida.");
    process.exitCode = 1;
    return;
  }

  console.log("OpenAI OK");
  console.log(`Model: ${env.openaiModel}`);
  console.log(`Response: ${result.response}`);
}

main().catch((error) => {
  console.log("OpenAI failed");
  console.log(`Model: ${env.openaiModel}`);
  console.log(`Response: ${error?.message || "erro inesperado"}`);
  process.exitCode = 1;
});
