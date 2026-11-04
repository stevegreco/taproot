import { flatten } from "@taproot-ds/tokens/flatten";
import semanticDark from "@taproot-ds/tokens/tokens/semantic-dark";
import semanticLight from "@taproot-ds/tokens/tokens/semantic-light";

export type LabTheme = "light" | "dark";

const semanticThemes = { light: semanticLight, dark: semanticDark } as const;
const themeTokens = new Map<LabTheme, Map<string, string>>();

const tokensFor = (theme: LabTheme) => {
  let tokens = themeTokens.get(theme);
  if (!tokens) {
    tokens = new Map(flatten(semanticThemes[theme]).map((token) => [token.path, token.value]));
    themeTokens.set(theme, tokens);
  }
  return tokens;
};

export const tokenValue = (theme: LabTheme, path: string) => {
  const value = tokensFor(theme).get(path);
  if (!value) throw new Error(`Missing ${path} in the ${theme} token build`);
  return value;
};

export const colorSwatch = (theme: LabTheme, path: string) => ({
  path,
  value: tokenValue(theme, path),
});
