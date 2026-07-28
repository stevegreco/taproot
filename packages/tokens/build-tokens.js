import StyleDictionary from "style-dictionary";
import { getAllConfigs } from "./style-dictionary.config.js";

for (const config of getAllConfigs()) {
  const sd = new StyleDictionary(config);
  await sd.buildAllPlatforms();
}
