"use client";

import {
  CheckIcon,
  DownloadSimpleIcon,
  LinkSimpleIcon,
  ShareNetworkIcon,
  XIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { GLASS } from "@/components/layout/chrome";
import { cn } from "@/lib/cn";

const COPIED_MS = 1600;

const ACTION =
  "inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-surface-hover";

interface ShareCardProps {
  name: string;
  label: string;
}

/**
 * The card is the page's own Open Graph image, read off the meta tag rather
 * than rebuilt here.
 *
 * Next appends a content hash to that route, so the URL cannot be composed from
 * the slug — and reading the tag means the preview, the download and whatever X
 * unfurls are all the same bytes, which is the only way they cannot disagree.
 */
export const ShareCard = ({ name, label }: ShareCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tag = document.querySelector<HTMLMetaElement>(
      'meta[property="og:image"]',
    );
    setCard(tag?.content ?? null);
  }, []);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  /** Escape closes it, because a dialog that only closes by mouse is a trap. */
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      setCopied(true);
    } catch {
      /* Clipboard is blocked in some contexts; the link is in the address bar. */
    }
  };

  const shareOnX = () => {
    const text = `${name} — its composition is published onchain, and anyone can read it.`;
    globalThis.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(globalThis.location.href)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-surface-hover"
      >
        <ShareNetworkIcon size={16} aria-hidden />
        Share
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/20"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${name}`}
            className={cn(
              GLASS,
              "relative w-full max-w-xl rounded-2xl p-5 shadow-glass",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-ink">Share index</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  The link renders this card wherever it is posted. Everything
                  on it is read from the contract, so it cannot claim more than
                  the record does.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="rounded-[8px] p-1.5 text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
              >
                <XIcon size={16} aria-hidden />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
              {card ? (
                // biome-ignore lint/performance/noImgElement: a generated route, not a static asset next/image can size
                <img
                  src={card}
                  alt={`${name} as a shareable card`}
                  className="w-full"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-xs text-ink-subtle">
                  Rendering the card…
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1">
              <button type="button" onClick={copy} className={ACTION}>
                {copied ? (
                  <CheckIcon size={16} weight="bold" aria-hidden />
                ) : (
                  <LinkSimpleIcon size={16} aria-hidden />
                )}
                {copied ? "Link copied" : "Copy link"}
              </button>

              <a
                href={card ?? "#"}
                download={`${label}.png`}
                className={cn(
                  ACTION,
                  !card && "pointer-events-none opacity-40",
                )}
              >
                <DownloadSimpleIcon size={16} aria-hidden />
                Download
              </a>

              <button type="button" onClick={shareOnX} className={ACTION}>
                <XLogoIcon size={16} aria-hidden />
                Share on X
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
