import { cp } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(process.argv[2] || "");
if (!output.startsWith("/tmp/")) throw new Error("Use a new /tmp output directory for the public sandbox build.");

await cp(resolve(".agent-os/here-now-workspace"), output, { recursive:true });
await cp(resolve("workspace/provenance-chip.mjs"), resolve(output, "workspace/provenance-chip.mjs"));
console.log(output);
