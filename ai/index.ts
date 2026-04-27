import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const geminiProModel = wrapLanguageModel({
  model: google("gemini-2.5-pro"),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
  middleware: customMiddleware,
});

// Embedding model for the RAG knowledge base (768 dimensions)
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");
