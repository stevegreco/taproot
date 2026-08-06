import primitiveTokenData from "@stevegreco/design-system/tokens/primitives";

type ColorScale = Record<string, string>;

export type ColorToken = {
  name: string;
  step: string;
  value: string;
};

export type ColorPalette = {
  description: string;
  items: ColorToken[];
  kicker: string;
  slug: string;
  title: string;
};

export const colors = primitiveTokenData.primitives.color;

const SCALE_DETAILS = [
  {
    key: "gray",
    title: "Gray",
    description: "Achromatic foundation · neutral values from near-white to ink",
    kicker: "Core palette",
  },
  {
    key: "robRoy",
    title: "Rob Roy",
    description: "Brand accent · warm golds for emphasis and highlights",
    kicker: "Core palette",
  },
  {
    key: "blueSmoke",
    title: "Blue Smoke",
    description: "Neutral UI · cool gray-greens for structure and text",
    kicker: "Core palette",
  },
  {
    key: "clay",
    title: "Clay",
    description: "Warm foundation · earthy surfaces with a grounded dark range",
    kicker: "Core palette",
  },
  {
    key: "amber",
    title: "Amber",
    description: "Status palette · warnings and attention without alarm",
    kicker: "System color",
  },
  {
    key: "moss",
    title: "Moss",
    description: "Status palette · positive and successful outcomes",
    kicker: "System color",
  },
  {
    key: "rust",
    title: "Rust",
    description: "Status palette · errors, destructive actions, and urgency",
    kicker: "System color",
  },
  {
    key: "sky",
    title: "Sky",
    description: "Status palette · information and neutral guidance",
    kicker: "System color",
  },
] as const;

const toKebabCase = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const palettes: ColorPalette[] = [
  {
    title: "Fixed",
    slug: "fixed",
    kicker: "Foundation",
    description: "Absolute endpoints · shared white and black references",
    items: (["white", "black"] as const).map((step) => ({
      step: step[0].toUpperCase() + step.slice(1),
      name: `--primitives-color-${step}`,
      value: colors[step],
    })),
  },
  ...SCALE_DETAILS.map(({ key, ...details }) => {
    const slug = toKebabCase(key);
    return {
      ...details,
      slug,
      items: Object.entries(colors[key] as ColorScale).map(([step, value]) => ({
        step,
        value,
        name: `--primitives-color-${slug}-${step}`,
      })),
    };
  }),
];
