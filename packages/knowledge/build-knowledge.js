import { fileURLToPath } from "node:url";
import { compile, KnowledgeCompileError } from "./src/compile/index.js";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));

try {
  const { bundles, warnings } = await compile({ workspaceRoot });
  for (const { code, message } of warnings) {
    console.warn(`  warn  ${code}  ${message}`);
  }
  for (const { visibility, recordCount, digest } of bundles) {
    console.log(`  ${visibility}: ${recordCount} records  ${digest}`);
  }
} catch (error) {
  if (!(error instanceof KnowledgeCompileError)) throw error;
  console.error(error.message);
  process.exit(1);
}
