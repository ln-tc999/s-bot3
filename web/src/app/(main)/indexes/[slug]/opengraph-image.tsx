import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";
import { activeChain } from "@/lib/chain/chains";
import { fetchIndex } from "@/lib/chain/registry";

export const alt = "An index published on BOT Chain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card, and the link preview, from one source.
 *
 * Rendered with `next/og` rather than drawn in the browser: it costs no
 * dependency, and the same URL is what X, Telegram and Discord unfurl — so a
 * pasted link shows the composition without anyone downloading anything.
 *
 * Satori supports a subset of CSS: flexbox only, and any element with more than
 * one child needs `display: flex` spelled out.
 */
const INK = "#0f1613";
const MUTED = "#5b6b64";
const LINE = "#d8e2dd";
const BRAND = "#10a37f";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = await fetchIndex(slug).catch(() => null);

  if (!index) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: MUTED,
          fontSize: 44,
        }}
      >
        {`No index published as "${slug}"`}
      </div>,
      size,
    );
  }

  /**
   * The list has to fit whatever was published, and an index may carry sixteen.
   * Five rows is what the middle band holds without crowding the badges, and the
   * type shrinks once there are more than three.
   */
  const VISIBLE = 5;
  const rows = index.constituents.slice(0, VISIBLE);
  const hidden = index.constituents.length - rows.length;
  const dense = index.constituents.length > 3;
  const rowFont = dense ? 27 : 32;
  const rowPad = dense ? 10 : 14;

  const badges = [
    index.isLocked ? "METHODOLOGY LOCKED" : "METHODOLOGY EDITABLE",
    index.agent ? "AGENT DELEGATED" : null,
    index.vault ? "TRADEABLE" : null,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            letterSpacing: 4,
            color: BRAND,
            fontWeight: 700,
          }}
        >
          {SITE.name.toUpperCase()}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: INK,
            marginTop: 18,
            lineHeight: 1.05,
          }}
        >
          {index.name}
        </div>

        <div
          style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 14 }}
        >
          {index.label}
        </div>
      </div>

      {/* The composition, which is the whole point of the card. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        {rows.map((entry) => (
          <div
            key={entry.token.symbol}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `2px solid ${LINE}`,
              paddingTop: rowPad,
              paddingBottom: rowPad,
              fontSize: rowFont,
            }}
          >
            <div style={{ display: "flex", color: INK }}>
              {entry.token.name}
            </div>
            <div style={{ display: "flex", color: INK, fontWeight: 700 }}>
              {`${(entry.weightBps / 100).toFixed(2)}%`}
            </div>
          </div>
        ))}
        {hidden > 0 ? (
          <div
            style={{
              display: "flex",
              borderTop: `2px solid ${LINE}`,
              paddingTop: rowPad,
              color: MUTED,
              fontSize: rowFont - 4,
            }}
          >
            {`and ${hidden} more`}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          {badges.map((badge) => (
            <div
              key={badge}
              style={{
                display: "flex",
                border: `2px solid ${LINE}`,
                borderRadius: 999,
                padding: "8px 20px",
                marginRight: 12,
                fontSize: 22,
                letterSpacing: 2,
                color: MUTED,
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
          {activeChain.name}
        </div>
      </div>
    </div>,
    size,
  );
}
