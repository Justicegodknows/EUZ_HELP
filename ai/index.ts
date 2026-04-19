import { createOpenAI } from "@ai-sdk/openai";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export async function getGeminiProModel() {
  const provider = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey: await getVercelOidcToken(),
  });
  return wrapLanguageModel({
    model: provider("google/gemini-2.5-pro"),
    middleware: customMiddleware,
  });
}

export async function getGeminiFlashModel() {
  const provider = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey: await getVercelOidcToken(),
  });
  return wrapLanguageModel({
    model: provider("google/gemini-2.5-flash"),
    middleware: customMiddleware,
  });
}
