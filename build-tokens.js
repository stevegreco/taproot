import StyleDictionary from "style-dictionary";
import primitivesConfig from "./style-dictionary.config.js";
import semanticLightConfig from "./style-dictionary.semantic-light.config.js";
import semanticDarkConfig from "./style-dictionary.semantic-dark.config.js";
import componentsConfig from "./style-dictionary.components.config.js";

for (const config of [primitivesConfig, semanticLightConfig, semanticDarkConfig, componentsConfig]) {
  const sd = new StyleDictionary(config);
  await sd.buildAllPlatforms();
}
