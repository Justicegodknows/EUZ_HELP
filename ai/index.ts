import { createGateway } from "@ai-sdk/gateway";
import { wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const gateway = createGateway({
  baseURL: "https://ai-gateway.vercel.sh/v1/ai",
});

export const geminiProModel = wrapLanguageModel({
  model: gateway("google/gemini-2.5-pro"),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  model: gateway("google/gemini-2.5-flash"),
  middleware: customMiddleware,
});
