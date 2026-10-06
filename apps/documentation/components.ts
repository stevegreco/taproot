import { defineComponents } from "blume";
import ComponentSpec from "./components/ComponentSpec.astro";
import BackgroundLab from "./components/labs/BackgroundLab.astro";
import BorderLab from "./components/labs/BorderLab.astro";
import ElevationLab from "./components/labs/ElevationLab.astro";
import ForegroundLab from "./components/labs/ForegroundLab.astro";
import SemanticTokenReference from "./components/SemanticTokenReference.astro";
import ShapeLab from "./components/labs/ShapeLab.astro";
import TypographyLab from "./components/labs/TypographyLab.astro";

export default defineComponents({
  mdx: {
    ComponentSpec,
    BackgroundLab,
    BorderLab,
    ElevationLab,
    ForegroundLab,
    SemanticTokenReference,
    ShapeLab,
    TypographyLab,
  },
});
