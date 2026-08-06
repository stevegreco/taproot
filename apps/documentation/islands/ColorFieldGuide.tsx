import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { colors, palettes, type ColorToken } from "../lib/color-palettes";
import "./color-field-guide.css";

type GuideStyle = CSSProperties & Record<`--${string}`, string | number>;

const channel = (value: number) => {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
};

const contrast = (first: string, second: string) => {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const preferredInk = (value: string) =>
  contrast(value, colors.blueSmoke["950"]) >= contrast(value, colors.white)
    ? "var(--primitives-color-blue-smoke-950)"
    : "var(--primitives-color-white)";

const swatchStyle = (token: ColorToken): GuideStyle => ({
  "--guide-swatch": `var(${token.name})`,
  "--guide-swatch-ink": preferredInk(token.value),
});

export default function ColorFieldGuide() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const copyToken = async (tokenName: string) => {
    try {
      await navigator.clipboard.writeText(tokenName);
    } catch {
      // The clipboard API can be unavailable in an insecure local preview.
    }

    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopiedToken(tokenName);
    copyTimerRef.current = setTimeout(() => setCopiedToken(null), 1700);
  };

  return (
    <section className="not-prose color-field-guide" data-color-field-guide>
      <aside className="color-field-guide__note">
        Primitives describe what a color <em>is</em>. Semantic tokens describe what it is{" "}
        <em>for</em>. Use the latter in product interfaces.
      </aside>

      <div className="color-field-guide__palettes">
        {palettes.map((palette) => (
          <section className="color-field-guide__palette" key={palette.slug}>
            <header className="color-field-guide__palette-header">
              <div>
                <p className="color-field-guide__kicker">{palette.kicker}</p>
                <h2 id={`palette-${palette.slug}`}>{palette.title}</h2>
                <p>{palette.description}</p>
              </div>
              <span>
                {palette.items.length} values · {palette.items[0].step}–{palette.items.at(-1)?.step}
              </span>
            </header>

            <div
              className="color-field-guide__spectrum"
              style={{ "--guide-columns": palette.items.length } as GuideStyle}
              aria-labelledby={`palette-${palette.slug}`}
            >
              {palette.items.map((token) => (
                <div
                  key={token.name}
                  className="color-field-guide__spectrum-swatch"
                  style={swatchStyle(token)}
                  data-color-swatch
                >
                  <span>{token.step}</span>
                </div>
              ))}
            </div>

            <div className="color-field-guide__token-grid">
              {palette.items.map((token) => {
                const contrastOnWhite = contrast(token.value, colors.white);
                const contrastOnBlack = contrast(token.value, colors.black);
                const bestContrast = Math.max(contrastOnWhite, contrastOnBlack);
                const bestBackground = contrastOnWhite >= contrastOnBlack ? "white" : "black";
                const isCopied = copiedToken === token.name;

                return (
                  <article
                    className="color-field-guide__token"
                    key={token.name}
                    style={swatchStyle(token)}
                  >
                    <span className="color-field-guide__chip" aria-hidden="true" />
                    <div className="color-field-guide__token-meta">
                      <code>{token.name}</code>
                      <div>
                        <span>{token.value.toUpperCase()}</span>
                        <span
                          className={
                            bestContrast >= 4.5
                              ? "color-field-guide__contrast color-field-guide__contrast--pass"
                              : "color-field-guide__contrast"
                          }
                        >
                          {bestContrast.toFixed(1)}:1 on {bestBackground}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="color-field-guide__copy"
                      onClick={() => copyToken(token.name)}
                      aria-label={`Copy ${token.name}`}
                      data-color-copy={token.name}
                    >
                      {isCopied ? "Copied" : "Copy"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div
        className={`color-field-guide__toast${copiedToken ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true">✓</span>
        {copiedToken ? `${copiedToken} copied` : ""}
      </div>
    </section>
  );
}
