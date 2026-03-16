"use client";

import { motion } from "framer-motion";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

import type { UIMessage } from "ai";

type Part = UIMessage["parts"][number];
type Imagepart = Extract<Part, { type: "file" }>;
type ReasoningImagepart = Extract<Part, { type: "reasoning-file" }>;

function clean(text: string) {
  if (/^\s*PROD_REGEN\(/.test(text)) return "";
  if (/^\s*\{[\s\S]*"action"\s*:/.test(text)) return "";
  return text.replace(/<\/?ctrl\d+>/gi, "");
}

function isimage(part: Part): part is Imagepart {
  return part.type === "file" && part.mediaType?.startsWith("image/");
}

function isreasoningimage(part: Part) {
  if (part.type === "reasoning-file" && part.mediaType?.startsWith("image/")) {
    return true;
  }

  if (!isimage(part)) return false;
  const google = part.providerMetadata?.google as { thought?: boolean } | undefined;
  const vertex = part.providerMetadata?.vertex as { thought?: boolean } | undefined;
  return google?.thought === true || vertex?.thought === true;
}

function groupParts(parts: UIMessage["parts"]) {
  const groups: Array<{ type: "reasoning"; parts: Part[] } | Part> = [];
  let block: Part[] = [];

  for (const part of parts) {
    if (part.type === "reasoning" || isreasoningimage(part)) {
      block.push(part);
      continue;
    }

    if (block.length > 0) {
      groups.push({ type: "reasoning", parts: block });
      block = [];
    }

    groups.push(part);
  }

  if (block.length > 0) {
    groups.push({ type: "reasoning", parts: block });
  }

  return groups;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className="opacity-0 group-hover/msg:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
      aria-label="Copy"
    >
      {copied ? (
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 8.5l3.5 3.5L13 4" />
        </svg>
      ) : (
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="5" y="5" width="9" height="9" rx="1.5" />
          <path d="M3 11V3a1.5 1.5 0 011.5-1.5H11" />
        </svg>
      )}
    </button>
  );
}

function DownloadButton({ url }: { url: string }) {
  const download = useCallback(() => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-${Date.now()}.png`;
    a.click();
    toast.success("Downloading");
  }, [url]);

  return (
    <button
      type="button"
      onClick={download}
      className="opacity-0 group-hover/msg:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
      aria-label="Download"
    >
      <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" />
      </svg>
    </button>
  );
}

export const Message = memo(function Message({
  role,
  parts,
  onImageClick,
}: {
  role: string;
  parts: UIMessage["parts"];
  onImageClick?: (url: string) => void;
}) {
  const groups = groupParts(parts);
  const isUser = role === "user";

  const allText = groups
    .filter((g): g is Part => !("parts" in g) && g.type === "text")
    .map((p) => ("text" in p ? clean(p.text) : ""))
    .join("\n")
    .trim();

  return (
    <motion.div
      className={`group/msg flex w-full md:max-w-[700px] px-4 md:px-0 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`flex flex-col gap-2 ${isUser ? "items-end max-w-[85%]" : "items-start w-full"}`}
      >
        {groups.map((group, index) => {
          if ("parts" in group && group.type === "reasoning") {
            return (
              <ReasoningBlock key={`reasoning-${index}`} parts={group.parts} />
            );
          }

          const part = group as Part;
          const text = part.type === "text" ? clean(part.text) : "";

          if (part.type === "text" && text.trim()) {
            return isUser ? (
              <div
                key={`text-${index}`}
                className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-[15px] leading-relaxed"
              >
                {text}
              </div>
            ) : (
              <div
                key={`text-${index}`}
                className="text-foreground text-[15px] leading-relaxed"
              >
                <Streamdown>{text}</Streamdown>
              </div>
            );
          }

          if (isimage(part)) {
            return (
              <motion.div
                key={`file-${index}`}
                className="relative"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <img
                  src={part.url}
                  alt="generated"
                  loading="lazy"
                  decoding="async"
                  onClick={() => onImageClick?.(part.url)}
                  className="rounded-xl max-w-full shadow-md cursor-zoom-in"
                />
                <div className="absolute top-2 right-2">
                  <DownloadButton url={part.url} />
                </div>
              </motion.div>
            );
          }

          return null;
        })}

        {!isUser && allText && (
          <div className="flex gap-1 -mt-1">
            <CopyButton text={allText} />
          </div>
        )}
      </div>
    </motion.div>
  );
});

export function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.div
      className="flex w-full md:max-w-[700px] px-4 md:px-0 justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-muted-foreground text-[15px] leading-relaxed">
        {message}
      </div>
    </motion.div>
  );
}

export function ThinkingIndicator() {
  return (
    <motion.div
      className="flex w-full md:max-w-[700px] px-4 md:px-0 justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <div className="thinking-dots flex gap-1">
          <span />
          <span />
          <span />
        </div>
        <span>Thinking</span>
      </div>
    </motion.div>
  );
}

function ReasoningBlock({ parts }: { parts: Part[] }) {
  const rawStreaming = parts.some(
    (p) => p.type === "reasoning" && "state" in p && p.state === "streaming",
  );
  const hasEverStreamed = useRef(false);
  if (rawStreaming) hasEverStreamed.current = true;

  const allDone = parts.every(
    (p) => p.type !== "reasoning" || !("state" in p) || p.state === "done",
  );

  const isStreaming = hasEverStreamed.current && !allDone;

  const [open, setOpen] = useState(rawStreaming);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const textParts = parts.filter((p) => p.type === "reasoning" && "text" in p);
  const images = parts.filter(isreasoningimage);
  const totalText = textParts
    .map((p) => ("text" in p ? clean(p.text) : ""))
    .join("");

  useEffect(() => {
    if (isStreaming) setOpen(true);
    if (!isStreaming && hasEverStreamed.current && images.length === 0) {
      setOpen(false);
    }
  }, [isStreaming, images.length]);

  const prevTextLen = useRef(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!isStreaming) {
      prevTextLen.current = totalText.length;
      return;
    }

    if (totalText.length > prevTextLen.current) {
      prevTextLen.current = totalText.length;
      const el = scrollRef.current;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      });
    }
  }, [isStreaming, totalText]);

  const scrollToImage = useCallback((index: number) => {
    if (!scrollRef.current) return;
    setHighlighted(index);
    setTimeout(() => setHighlighted(null), 2000);

    const markers = [`image ${index + 1}`, `variation ${index + 1}`, `draft ${index + 1}`, `option ${index + 1}`];
    const text = scrollRef.current.textContent?.toLowerCase() ?? "";
    let pos = -1;
    for (const marker of markers) {
      pos = text.indexOf(marker);
      if (pos >= 0) break;
    }

    if (pos >= 0 && scrollRef.current) {
      const ratio = pos / Math.max(text.length, 1);
      scrollRef.current.scrollTo({
        top: ratio * scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isStreaming ? (
          <div className="thinking-dots flex gap-1">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <svg
            className={`size-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4 2l4 4-4 4" />
          </svg>
        )}
        {isStreaming ? "Reasoning..." : images.length > 1 ? `Reasoning (${images.length} drafts)` : "Reasoning"}
      </button>
      {open && (
          <div className="animate-in fade-in duration-150">
            <div className="border border-border rounded-xl overflow-hidden">
              {!isStreaming && images.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/30">
                    {images.slice(0, 3).map((part, i) => (
                      <motion.div
                        key={`ri-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className={`relative cursor-pointer rounded-lg overflow-hidden ring-2 transition-all ${
                          highlighted === i
                            ? "ring-primary"
                            : "ring-transparent hover:ring-primary/40"
                        }`}
                        onClick={() => scrollToImage(i)}
                      >
                        <img
                          src={(part as { url: string }).url}
                          alt={`Draft ${i + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 size-5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center justify-center">
                          {i + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {totalText && (
                <div ref={scrollRef} className="max-h-[200px] overflow-y-auto reasoning-scroll p-3 text-sm text-muted-foreground leading-relaxed">
                  <Streamdown>{totalText}</Streamdown>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
