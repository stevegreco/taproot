import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadSourceSans } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Fonts and colors come from the Ember & Sage primitives in packages/tokens.
const lora = loadLora("normal", { weights: ["500", "600"], subsets: ["latin"] });
const sans = loadSourceSans("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const fonts = {
  display: lora.fontFamily,
  sans: sans.fontFamily,
  mono: mono.fontFamily,
};

export const color = {
  paper: "#f7f2e8",
  card: "#fffdf8",
  line: "#e2d8c6",
  ink: "#221a13",
  muted: "#5e4733",
  faint: "#9a7a58",
  ember: "#d98f27",
  emberDeep: "#a0501d",
  emberSoft: "#f7edce",
  sage: "#4a6b3d",
  sageSoft: "#e3ecd9",
  slate: "#3b4a43",
  sky: "#2f5973",
  skySoft: "#d6e1ea",
  rust: "#d03025",
  rustDeep: "#8c241d",
  rustSoft: "#fedfdd",
};

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
