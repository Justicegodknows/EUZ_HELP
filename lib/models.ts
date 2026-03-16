import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { gateway } from "ai";

const order = { gateway: { order: ["google", "vertex"] } };
const thought = {
  thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
};
const imageSystemInstruction = `You are a creative image assistant. When asked to create an image:

1. In your thinking, generate 3 different variations of the image, labeled as Image 1, Image 2, and Image 3. Each variation should try a different style, angle, or interpretation. Actually generate the image files in your thinking.
2. In your thinking, briefly compare the 3 variations and pick the best one.
3. In your visible response, generate and return only the single best image as a new final version.

ALWAYS generate 3 different variations in your thinking.
NEVER combine the variations into a single image.

Think step by step, create each of the 3 image variations one by one, all as part of your thinking.

Only after you've generated all 3 images with the 3 variations, compare them and pick the best one in your thinking, THEN generate your final response with just the single best image.

Always generate real images. Never output JSON, tool calls, or text descriptions instead of images.`;

function pair<T extends object>(value: T) {
  return {
    ...order,
    google: { ...value },
    vertex: { ...value },
  };
}

export const models = {
  "gemini-3.1-flash-image": {
    label: "Gemini 3.1 Flash Image",
    model: google("gemini-3.1-flash-image-preview"),
    imageOptions: {
      google: {
        responseModalities: ["TEXT", "IMAGE"],
        thinkingConfig: {
          thinkingLevel: "high",
          includeThoughts: true,
        },
      } satisfies GoogleLanguageModelOptions,
    },
    textOptions: {
      google: {
        responseModalities: ["TEXT"],
        thinkingConfig: {
          thinkingLevel: "high",
          includeThoughts: true,
        },
      } satisfies GoogleLanguageModelOptions,
    },
    imageSystem: imageSystemInstruction,
    textSystem: "You are a helpful assistant. Respond concisely.",
  },
  "gemini-3-pro": {
    label: "Gemini 3 Pro Reasoning",
    model: gateway("google/gemini-3-pro-preview"),
    imageOptions: pair(thought),
    textOptions: pair(thought),
    imageSystem:
      "You are a helpful reasoning assistant. Do not pretend to call image tools or output fake image actions.",
    textSystem:
      "You are a helpful reasoning assistant. Do not pretend to call image tools or output fake image actions.",
  },
  "gemini-3-pro-image": {
    label: "Gemini 3 Pro Image",
    model: google("gemini-3-pro-image-preview"),
    imageOptions: {
      google: {
        responseModalities: ["TEXT", "IMAGE"],
        thinkingConfig: {
          includeThoughts: true,
        },
      } satisfies GoogleLanguageModelOptions,
    },
    textOptions: {
      google: {
        responseModalities: ["TEXT"],
        thinkingConfig: {
          includeThoughts: true,
        },
      } satisfies GoogleLanguageModelOptions,
    },
    imageSystem: imageSystemInstruction,
    textSystem: "You are a helpful assistant. Respond concisely.",
  },
};

export type ModelId = keyof typeof models;

export const modelIds: ModelId[] = [
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

export const labels: Record<ModelId, string> = {
  "gemini-3.1-flash-image": models["gemini-3.1-flash-image"].label,
  "gemini-3-pro": models["gemini-3-pro"].label,
  "gemini-3-pro-image": models["gemini-3-pro-image"].label,
};

export const shortLabels: Record<ModelId, string> = {
  "gemini-3.1-flash-image": "3.1 Flash Image",
  "gemini-3-pro": "3 Pro",
  "gemini-3-pro-image": "3 Pro Image",
};
