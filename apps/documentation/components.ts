import { defineComponents } from "blume";
import BackgroundLab from "./components/labs/BackgroundLab.astro";
import BorderLab from "./components/labs/BorderLab.astro";
import ElevationLab from "./components/labs/ElevationLab.astro";
import ForegroundLab from "./components/labs/ForegroundLab.astro";
import ShapeLab from "./components/labs/ShapeLab.astro";
import TypographyLab from "./components/labs/TypographyLab.astro";

export default defineComponents({
  mdx: {
    BackgroundLab,
    BorderLab,
    ElevationLab,
    ForegroundLab,
    ShapeLab,
    TypographyLab,
  },
});
