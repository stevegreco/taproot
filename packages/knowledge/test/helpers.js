import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of a folder under test/fixtures. */
export const fixture = (name) => path.join(here, "fixtures", name);
